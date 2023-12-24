const mongoose = require("mongoose");

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
      maxlength: [1000, "Features can be max. 1000 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: Date,
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Comment",
      },
    ],
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

ProductSchema.pre(/(update)/i, async function () {
  this.set("updatedAt", new Date(Date.now()));
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

const Product = model("Product", ProductSchema);

module.exports = Product;
