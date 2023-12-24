const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentSchema = new Schema(
  {
    comment: {
      type: String,
      trim: true,
      maxlength: [250, "Comment can be max. 250 characters"],
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    product: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Product",
    },
    ratings: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, 5],
        message: "Rating must be between 1 & 5",
      },
      default: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_, returnedComment) {
        delete returnedComment._id;
        delete returnedComment.__v;

        return returnedComment;
      },
    },
    toObject: { virtuals: true },
  }
);

const Comment = model("Comment", commentSchema);

module.exports = Comment;
