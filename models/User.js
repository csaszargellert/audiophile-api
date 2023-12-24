const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Email is invalid"],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Password is required"],
      select: false,
      validate: [validator.isStrongPassword, "Password is invalid"],
    },
    confirmPassword: {
      type: String,
      required: [true, "Confirm password is required"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Password confirmation is invalid",
      },
    },
    roles: {
      type: [String],
      enum: {
        values: ["user", "admin"],
        message: "{PATH} has failed with {VALUE}",
      },
      default: ["user"],
    },
    productsId: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    ],
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Comment",
      },
    ],
    refreshToken: String,
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

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  this.confirmPassword = undefined;
  next();
});

UserSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = model("User", UserSchema);

module.exports = User;
