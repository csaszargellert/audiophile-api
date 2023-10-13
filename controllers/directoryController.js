const catchAsync = require("../utils/CatchAsync");
const { deleteFilesFromDirectory } = require("../utils/directoryHandler");

const getNewlyConstructedFilePaths = function (files) {
  return Object.values(files).reduce((prevValue, currentImageArray) => {
    const onlyFilePath = currentImageArray.map((image) => image.filename);

    return [...prevValue, ...onlyFilePath];
  }, []);
};

const deletePrevFiles = catchAsync(async function (req, res, next) {
  if (!req.directory) return next();
  const newFilePaths = getNewlyConstructedFilePaths(req.files);
  await deleteFilesFromDirectory(req.directory, newFilePaths);
  next();
});

module.exports = { deletePrevFiles };
