const mongoose = require("mongoose");
const catchAsync = require("./CatchAsync");

const initializeSession = catchAsync(async function (req, res, next) {
  const session = await mongoose.startSession();
  req.session = session;
  next();
});

module.exports = initializeSession;
