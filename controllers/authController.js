const AppError = require("../utils/AppError");
const catchAsync = require("../utils/CatchAsync");
const User = require("../models/User");
const { signJwt, verifyJwt } = require("../utils/JsonWebToken");

const signup = catchAsync(async function (req, res, next) {
  const { username, email, password, confirmPassword } = req.body;

  const newUser = new User({ username, email, password, confirmPassword });

  const savedUser = await newUser.save();
  savedUser.password = undefined;
  res.status(201).json({ data: savedUser });
});

const signin = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email or password is empty", 400);
  }

  const foundUser = await User.findOne({ email }).select("+password").exec();

  if (!foundUser || !(await foundUser.isPasswordCorrect(password))) {
    throw new AppError("Email or password is invalid", 400);
  }

  const data = {
    roles: foundUser.roles,
    userId: foundUser.id,
    productsId: foundUser.productsId,
  };

  const accessToken = await signJwt(data, process.env.JWT_ACCESS_SALT, {
    expiresIn: "1d",
  });

  const refreshToken = await signJwt(data, process.env.JWT_REFRESH_SALT, {
    expiresIn: "30d",
  });

  res.cookie("refreshToken", refreshToken, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  });

  foundUser.refreshToken = refreshToken;
  await foundUser.save({ validateModifiedOnly: true });

  foundUser.refreshToken = undefined;

  res.status(200).json({ jwt: accessToken });
});

const authenticateUser = catchAsync(async function (req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new AppError("Authentication required", 401);
  }

  const jwt = authorization.split("Bearer ")[1];

  const decoded = await verifyJwt(jwt, process.env.JWT_ACCESS_SALT);

  const { userId } = decoded;

  const foundUser = await User.findById(userId);

  if (foundUser.id !== userId) {
    throw new AppError("Not authorized", 403);
  }

  req.user = foundUser;
  next();
});

const requireRoles = function (...roles) {
  return function (req, res, next) {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (roles.every((role) => req.user.roles.includes(role))) {
      return next();
    } else {
      throw new AppError("Access denied", 403);
    }
  };
};

const signout = catchAsync(async function (req, res, next) {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });
  res.clearCookie("refreshToken", {
    secure: true,
    httpOnly: true,
  });
  res.status(204).json({ data: "Logout successful" });
});

module.exports = {
  signup,
  signin,
  authenticateUser,
  requireRoles,
  signout,
};
