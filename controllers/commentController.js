const Comment = require("../models/Comment");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/CatchAsync");

const createComment = catchAsync(async function (req, res, next) {
  const { comment, ratings } = req.body;

  if (!comment) throw new AppError("Comment cannot be empty", 400);

  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) throw new AppError("Product not found", 404);

  const user = req.user;
  const session = req.session;

  const newComment = new Comment({
    comment,
    user: user.id,
    product: productId,
    ratings: ratings || null,
  });

  try {
    await session.startTransaction();

    const savedComment = await newComment.save({ session });

    product.comments.push(savedComment.id);
    await product.save({ session });

    user.comments.push(savedComment.id);
    await user.save({ session, validateBeforeSave: false });

    await session.commitTransaction();

    res.status(200).json({ data: savedComment });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

const deleteComment = catchAsync(async function (req, res, next) {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) throw new AppError("Comment not found", 404);

  const user = req.user;

  if (user && user.id !== comment.user.toString())
    throw new AppError("Not authorized to delete comment", 400);

  const session = req.session;

  try {
    await session.startTransaction();

    await Comment.findByIdAndDelete(commentId).session(session);

    user.comments = user.comments.filter(
      (comment) => comment.toString() !== commentId
    );
    await user.save({ session, validateBeforeSave: false });

    await Product.findByIdAndUpdate(comment.product, {
      $pull: { comments: commentId },
    }).session(session);

    await session.commitTransaction();

    res.status(200).json({ data: "Comment deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

module.exports = {
  createComment,
  deleteComment,
};
