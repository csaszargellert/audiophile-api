const crypto = require("crypto");

const generateRandomImageName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

module.exports = { generateRandomImageName };
