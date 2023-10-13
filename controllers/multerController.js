const multer = require("multer");
const AppError = require("../utils/AppError");
const {
  constructFileName,
  constructDirectoryPath,
  makeDirectory,
  directoryExists,
} = require("../utils/directoryHandler");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const { category, name } = req.body;

    const directory = constructDirectoryPath(name, category);
    if (!directoryExists(directory)) {
      await makeDirectory(directory);
    }

    if (!req.directory) {
      req.directory = directory;
    }
    cb(null, directory);
  },
  filename: function (req, file, cb) {
    cb(null, constructFileName(file));
  },
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new AppError("Invalid file type", 400);
    return cb(error, false);
  }

  cb(null, true);
};

const limits = {
  files: 10,
  fileSize: 10000000,
};

const upload = multer({ storage, fileFilter, limits });

const uploadImageCover = upload.single("image");
const uploadProductImages = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 3 },
]);

module.exports = {
  uploadImageCover,
  uploadProductImages,
};
