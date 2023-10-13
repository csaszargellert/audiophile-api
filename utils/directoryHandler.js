const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

const serializeDirectoryName = function (name) {
  return name.replace(/[\s]/g, "-").toLowerCase();
};

const constructDirectoryPath = function (name, category) {
  const serializedName = serializeDirectoryName(name);

  return path.join(
    "https://gellert-audiophile.netlify.app",
    "public",
    "assets",
    `product-${serializedName}-${category}`
  );
};

const renameDirectory = async function (oldDirectoryName, newDirectoryName) {
  return await fsPromises.rename(oldDirectoryName, newDirectoryName);
};

const deleteDirectory = async function (directoryPath, options) {
  return await fsPromises.rm(directoryPath, options);
};

const makeDirectory = async function (directoryPath) {
  return await fsPromises.mkdir(directoryPath, { recursive: true });
};

const readFilesFromDirectory = async function (directoryPath) {
  return await fsPromises.readdir(directoryPath);
};

const directoryExists = function (directoryPath) {
  return fs.existsSync(directoryPath);
};

const deleteFilesFromDirectory = async function (directoryPath, excludedPaths) {
  const files = await readFilesFromDirectory(directoryPath);
  console.log(files);
  console.log(excludedPaths);
  const filesPromises = files
    .filter((file) => !excludedPaths.includes(file))
    .map((file) => {
      return fsPromises.unlink(path.join(directoryPath, file));
    });
  return await Promise.all(filesPromises);
};

const copyFile = async function (imagesToCopy, oldDirectory, newDirectory) {
  const filePromises = imagesToCopy.map((image) => {
    return fsPromises.copyFile(
      path.join(oldDirectory, image),
      path.join(newDirectory, image)
    );
  });

  return await Promise.all(filePromises);
};

const constructFileName = function (file) {
  const prefix = file.fieldname;
  const suffix = Date.now() + "-" + Math.random().toString().split(".")[1];
  const extension = file.mimetype.split("/")[1];
  return `${prefix}-${suffix}.${extension}`;
};

module.exports = {
  constructDirectoryPath,
  serializeDirectoryName,
  deleteDirectory,
  makeDirectory,
  readFilesFromDirectory,
  directoryExists,
  deleteFilesFromDirectory,
  constructFileName,
  renameDirectory,
  copyFile,
};
