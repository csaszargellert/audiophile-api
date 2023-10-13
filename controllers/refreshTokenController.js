const catchAsync = require("../utils/CatchAsync");
const AppError = require("../utils/AppError");
const { verifyJwt, signJwt } = require("../utils/JsonWebToken");
const User = require("../models/User");

const refreshToken = catchAsync(async function (req, res, next) {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new AppError("Authentication required", 401);
  }

  const foundUser = await User.findOne({ refreshToken });

  if (!foundUser) {
    throw new AppError("User not found", 404);
  }

  const decoded = await verifyJwt(refreshToken, process.env.JWT_REFRESH_SALT);

  const { userId } = decoded;

  if (userId !== foundUser.id) {
    throw new AppError("Not authorized", 403);
  }

  const accessToken = await signJwt(
    {
      roles: foundUser.roles,
      userId: foundUser.id,
    },
    process.env.JWT_ACCESS_SALT,
    {
      expiresIn: "1d",
    }
  );

  res.status(200).json({ jwt: accessToken });
});

module.exports = refreshToken;
