const mongoose = require("mongoose");
const {
  constructDirectoryPath,
  renameDirectory,
  deleteDirectory,
  readFilesFromDirectory,
  copyFile,
  deleteFilesFromDirectory,
} = require("../utils/directoryHandler");
const url = require("url");
const path = require("path");

const { Schema, model } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Product name is required"],
    },
    image: {
      type: String,
      required: [true, "Image must be provided"],
    },
    category: {
      type: String,
      lowercase: true,
      enum: {
        values: ["earphones", "headphones", "speakers"],
        message: "Category has failed for value '{VALUE}'",
      },
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    gallery: [String],
    features: {
      type: String,
      trim: true,
      maxLength: [1000, "Features can be max. 1000 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: Date,
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret, opt) {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

ProductSchema.virtual("isNew").get(function () {
  const copy = new Date();
  // Product is new for 1 week
  const timeToAdd = 7 * 24 * 60 * 60 * 1000;
  const timeLimitToIsNew = copy.setTime(this.createdAt.getTime() + timeToAdd);

  return timeLimitToIsNew >= Date.now();
});

ProductSchema.virtual("constructedPath").get(function () {
  const directoryPath = constructDirectoryPath(this.name, this.category);
  const constructedFilePath = path.join(directoryPath, this.image);
  const pathURL = url.pathToFileURL(constructedFilePath);
  return pathURL;
});

ProductSchema.pre(/(update)/i, async function () {
  this.set("updatedAt", new Date(Date.now()));
});

ProductSchema.pre(/(update)/i, async function () {
  const oldProduct = await this.model.findOne(this.getQuery());

  const newName = this.get("name");
  const newCategory = this.get("category");
  const newImage = this.get("image");
  const newGallery = this.get("gallery");
  const oldName = oldProduct.name;
  const oldCategory = oldProduct.category;

  const oldDirectoryName = constructDirectoryPath(oldName, oldCategory);
  const newDirectoryName = constructDirectoryPath(newName, newCategory);

  if (newName !== oldName || newCategory !== oldCategory) {
    if (!newImage && !newGallery) {
      await renameDirectory(oldDirectoryName, newDirectoryName);
    } else {
      if (!newImage) {
        const allPictures = await readFilesFromDirectory(oldDirectoryName);
        const notModifiedImage = allPictures.filter((picture) =>
          picture.includes("image")
        );
        await copyFile(notModifiedImage, oldDirectoryName, newDirectoryName);
      } else if (!newGallery) {
        const allPictures = await readFilesFromDirectory(oldDirectoryName);
        const notModifiedImage = allPictures.filter((picture) =>
          picture.includes("gallery")
        );
        await copyFile(notModifiedImage, oldDirectoryName, newDirectoryName);
      }

      await deleteDirectory(oldDirectoryName, { recursive: true });
    }
  } else {
    const oldGallery = oldProduct.gallery;
    const oldImage = oldProduct.image;

    if (newImage && newGallery) {
      await deleteFilesFromDirectory(oldDirectoryName, [
        ...newGallery,
        newImage,
      ]);
    } else if (newImage) {
      await deleteFilesFromDirectory(oldDirectoryName, [
        ...oldGallery,
        newImage,
      ]);
    } else if (newGallery) {
      await deleteFilesFromDirectory(oldDirectoryName, [
        ...newGallery,
        oldImage,
      ]);
    }
  }
});

ProductSchema.statics.filterByCategory = async function (category) {
  return await this.aggregate()
    .match({ category })
    .addFields({
      isNew: {
        $gte: [
          { $dateAdd: { startDate: "$createdAt", unit: "week", amount: 1 } },
          new Date(),
        ],
      },
      id: { $toString: "$_id" },
    })
    .project({
      _id: 0,
      description: 1,
      name: 1,
      id: 1,
      isNew: 1,
      image: 1,
    })
    .sort({ isNew: -1 });
};

ProductSchema.post(/(delete)/i, async function (doc) {
  const directoryPath = constructDirectoryPath(doc.name, doc.category);
  await deleteDirectory(directoryPath, { recursive: true, force: true });
});

const Product = model("Product", ProductSchema);

module.exports = Product;
