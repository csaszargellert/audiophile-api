const AppError = require("../utils/AppError");
const Comment = require("../models/Comment");
const User = require("../models/User");
const catchAsync = require("../utils/CatchAsync");
const Product = require("../models/Product");
const { AwsBucket } = require("../utils/awsBucket");

const getImageKeys = function (fileArray) {
  return fileArray.map((file) => file.key);
};

const getProducts = catchAsync(async function (req, res, next) {
  const { favorites } = req.query;

  const query = Product.find();
  if (favorites) {
    const parsedFavorites = JSON.parse(favorites);
    query.in("_id", parsedFavorites);
  }
  const products = await query.select("image category name createdAt").exec();

  for (const product of products) {
    product.image = await AwsBucket.createSignedUrl(product.image);
  }

  res.status(200).json({ data: products });
});

const createProduct = catchAsync(async function (req, res, next) {
  const { name, category, description, price, features } = req.body;

  const session = req.session;
  const user = req.user;

  const newProduct = new Product({
    name,
    category,
    description,
    price,
    image: getImageKeys(req.files.image)[0],
    gallery: getImageKeys(req.files.gallery),
    features,
  });

  try {
    await session.startTransaction();
    const savedProduct = await newProduct.save({ session });

    user.productsId.push(savedProduct.id);
    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();

    res.status(200).json({ data: savedProduct });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

const getProduct = catchAsync(async function (req, res, next) {
  const { productId } = req.params;

  const foundProduct = await Product.findById(productId)
    .populate({
      path: "comments",
      select: "comment user ratings createdAt",
      populate: {
        path: "user",
        select: "username",
      },
    })
    .exec();

  if (!foundProduct) {
    throw new AppError("Product not found", 404);
  }

  foundProduct.image = await AwsBucket.createSignedUrl(foundProduct.image);
  const galleryPromises = foundProduct.gallery.map((galleryImage) =>
    AwsBucket.createSignedUrl(galleryImage)
  );
  foundProduct.gallery = await Promise.all(galleryPromises);

  res.status(200).json({ data: foundProduct });
});

const deleteProduct = catchAsync(async function (req, res, next) {
  const { productId } = req.params;
  const session = req.session;
  const user = req.user;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const pictures = [product.image, ...product.gallery].map((picture) =>
    AwsBucket.deleteFile(picture)
  );
  const deletePictures = await Promise.all(pictures);

  if (!deletePictures.every((picture) => picture.DeleteMarker)) {
    throw new AppError("Image cannot be deleted", 500);
  }

  try {
    await session.startTransaction();

    const deletedProduct = await Product.deleteOne({ _id: productId })
      .session(session)
      .exec();

    if (!deletedProduct) {
      throw new AppError("Product not found", 404);
    }

    const comments = deletedProduct.comments;

    await Comment.deleteMany({
      _id: { $in: comments },
    }).session(session);

    await User.updateMany(
      { comments: { $in: comments } },
      { $pull: { comments: { $in: comments } } }
    ).session(session);

    user.productsId = user.productsId.filter(
      (id) => id.toString() !== productId
    );

    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();

    res.status(200).json({ data: "Product deleted" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

const updateProduct = catchAsync(async function (req, res, next) {
  const { productId } = req.params;
  const { name, category, description, price, features } = req.body;
  const { image, gallery } = req.files;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (image && gallery) {
    const imagePromises = [product.image, ...product.gallery].map((picture) =>
      AwsBucket.deleteFile(picture)
    );
    await Promise.all(imagePromises);
  } else if (image) {
    await AwsBucket.deleteFile(product.image);
  } else if (gallery) {
    const imagePromises = product.gallery.map((picture) =>
      AwsBucket.deleteFile(picture)
    );
    await Promise.all(imagePromises);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name,
      category,
      description,
      price,
      features,
      image: image && getImageKeys(req.files.image)[0],
      gallery: gallery && getImageKeys(req.files.gallery),
    },
    { runValidators: true, new: true }
  );

  res.status(201).json({ data: updatedProduct });
});

const getProductsByCategory = catchAsync(async function (req, res, next) {
  const { slug } = req.params;
  const products = await Product.filterByCategory(slug);

  for (const product of products) {
    product.image = await AwsBucket.createSignedUrl(product.image);
  }

  res.status(200).json({ data: products });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductsByCategory,
};
