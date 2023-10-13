const AppError = require("../utils/AppError");

const convertToTitleCase = function (value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
};

const handleCastError = function (error) {
  return `Cast to ${error.kind} failed for value ${error.value} at path ${error.path}`;
};

const handleValidationError = function (errors) {
  const errorMessages = Object.values(errors)
    .map((error) => {
      if (error.name === "CastError") {
        return handleCastError(error);
      } else {
        return error.message;
      }
    })
    .join(", ");
  return new AppError(errorMessages, 400);
};

const handleDuplicateValue = function (error) {
  const errorMessage = Object.keys(error)
    .map((field) => `${convertToTitleCase(field)} already exists`)
    .join(", ");

  return new AppError(errorMessage, 400);
};

const handleJwt = function (errorMessage) {
  return new AppError(errorMessage, 403);
};

const globalErrorHandler = function (error, req, res, next) {
  const copiedError = JSON.parse(JSON.stringify(error));
  copiedError.message = error.message;
  let err;
  if (copiedError.name === "ValidationError") {
    err = handleValidationError(copiedError.errors);
  } else if (copiedError.name === "CastError") {
    const errorMessage = handleCastError(copiedError);
    err = new AppError(errorMessage, 400);
  } else if (copiedError.code === 11000) {
    err = handleDuplicateValue(copiedError.keyValue);
  } else if (copiedError.name === "TokenExpiredError") {
    err = handleJwt(copiedError.message);
  } else if (copiedError.name === "JsonWebTokenError") {
    err = handleJwt(copiedError.message);
  } else {
    err = copiedError;
  }

  return res.status(err.status || 500).json({ error: err.message });
};

module.exports = globalErrorHandler;
