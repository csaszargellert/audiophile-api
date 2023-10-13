const AppError = require("../utils/AppError");
const catchAsync = require("../utils/CatchAsync");
const Product = require("../models/Product");
const { cloudinary } = require("../utils/cloudinary");

const getProducts = catchAsync(async function (req, res, next) {
  const products = await Product.find({}).exec();

  res.status(200).json({ data: products });
});

const createProduct = catchAsync(async function (req, res, next) {
  const { name, category, description, price, features, image, gallery } =
    req.body;
  const session = req.session;
  const user = req.user;

  const images = [image, ...gallery[0], gallery[1]].map((img) => {
    return cloudinary.uploader.upload(img);
  });

  const uploaded = await Promise.all(images);

  const imageToUpload = uploaded.splice(0, 1)[0];

  const galleryToUpload = uploaded.map((img) => img.secure_url);

  const newProduct = new Product({
    name,
    category,
    description,
    price,
    image: imageToUpload.secure_url,
    gallery: galleryToUpload,
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
  const { name, category, description, price, features, image, gallery } =
    req.body;

  let imageToUpload;
  let galleryToUpload;
  if (image && gallery) {
    const images = [image, ...gallery[0], gallery[1]].map((img) => {
      return cloudinary.uploader.upload(img);
    });

    const uploaded = await Promise.all(images);

    imageToUpload = uploaded.splice(0, 1)[0];
    galleryToUpload = uploaded.map((img) => img.secure_url);
  } else if (image) {
    imageToUpload = await cloudinary.uploader.upload(image);
  } else if (gallery) {
    gallery.map((img) => {
      return cloudinary.uploader.upload(img);
    });

    const uploaded = await Promise.all(images);

    galleryToUpload = uploaded.map((img) => img.secure_url);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name,
      category,
      description,
      price,
      features,
      image: imageToUpload?.secure_url,
      gallery: galleryToUpload,
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
