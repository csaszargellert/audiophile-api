const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3Client } = require("./awsBucket");
const { generateRandomImageName } = require("./randomNameGenerator");

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, generateRandomImageName());
    },
  }),
});

const uploadPictures = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 3 },
]);

module.exports = {
  uploadPictures,
};
