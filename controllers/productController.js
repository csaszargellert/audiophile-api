const AppError = require("../utils/AppError");
const catchAsync = require("../utils/CatchAsync");
const Product = require("../models/Product");

const getImageFilename = function (files) {
  if (Object.keys(files).length === 0) return null;
  if (!files.image) return null;
  return files?.image[0]?.filename;
};

const getGalleryFilenames = function (files) {
  if (Object.keys(files).length === 0) return null;
  return files?.gallery?.map((fileProps) => fileProps?.filename);
};

const getProducts = catchAsync(async function (req, res, next) {
  const products = await Product.find({}).exec();

  res.status(200).json({ data: products });
});

const createProduct = catchAsync(async function (req, res, next) {
  const { name, category, description, price, features } = req.body;
  const imageFilename = getImageFilename(req.files);
  const galleryFilenames = getGalleryFilenames(req.files);
  const session = req.session;
  const user = req.user;

  const newProduct = new Product({
    name,
    category,
    description,
    price,
    image: imageFilename,
    gallery: galleryFilenames,
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

  const foundProduct = await Product.findById(productId).exec();

  if (!foundProduct) {
    throw new AppError("Product not found", 404);
  }
  res.status(200).json({ data: foundProduct });
});

const deleteProduct = catchAsync(async function (req, res, next) {
  const { productId } = req.params;
  const session = req.session;
  const user = req.user;

  try {
    await session.startTransaction();

    const deletedProduct = await Product.findByIdAndDelete(productId)
      .session(session)
      .exec();

    if (!deletedProduct) {
      throw new AppError("Product not found", 404);
    }

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

  const imageFilename = getImageFilename(req.files);
  const galleryFilenames = getGalleryFilenames(req.files);

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name,
      category,
      description,
      price,
      features,
      image: imageFilename ?? undefined,
      gallery: galleryFilenames ?? undefined,
    },
    { runValidators: true, new: true }
  );

  if (!updatedProduct) {
    throw new AppError("Product not found", 404);
  }

  res.status(201).json({ data: updatedProduct });
});

const getProductsByCategory = catchAsync(async function (req, res, next) {
  const { slug } = req.params;
  const products = await Product.filterByCategory(slug);
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
