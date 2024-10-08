require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "merchant"],
    required: true,
    default: "user",
  },
  deviceId: {
    type: String,
  },
  registeredForStore: {
    type: String,
    default: "false",
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: {
    type: Date,
  },
  wishlist: { type: [String] },
  bookings: [String],
  storeId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.generateToken = async function () {
  try {
    const token = jwt.sign(
      { _id: this._id.toString() },
      process.env.SECRET_KEY
    );
    console.log(token);
    await this.save();
    return token;
  } catch (error) {
    return error;
  }
};
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

const UserData = new mongoose.model("UserData", userSchema);

module.exports = UserData;
