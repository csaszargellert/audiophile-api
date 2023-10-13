const jwt = require("jsonwebtoken");

const signJwt = function (data, privateKey, options) {
  return new Promise((resolve, reject) => {
    jwt.sign(data, privateKey, options, function (error, token) {
      if (error) {
        reject(error);
      }
      resolve(token);
    });
  });
};

const verifyJwt = function (token, privateKey) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, privateKey, function (error, decoded) {
      if (error) {
        reject(error);
      }
      resolve(decoded);
    });
  });
};

module.exports = {
  signJwt,
  verifyJwt,
};
