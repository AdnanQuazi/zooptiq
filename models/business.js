require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dummy = {
  ownerName: "Adnan Quazi",
  shopName: "WearNX",
  contactNumber: "88888888",
  email: "asdasdas@gmail.com",
  password: "hahaahaha",
  address: "ok as dasd asd asd ada dsadasd asd a",
  businessType: "clothing",
  images: ["ok", "ok", "pk"],
  gst: "998877778888",

  products: [
    {
      name: "Rolex",
      category: "Accesories",
      "sub-category": "Watch",
    },
    {
      name: "iPhone",
      category: "Electronics",
      "sub-category": "Smartphone",
    },
  ],
};

const variantSchema = new mongoose.Schema({
  sharedImagePath: { type: String, required: true },
  Images: [{ type: String, required: true }],
  additionalFields: { type: mongoose.Schema.Types.Mixed }, // Allows any additional fields
});

const productSchema = new mongoose.Schema({
  selectedVariations: { type: [String], required: true },
  productName: { type: String, required: true },
  brand: {
    type: String,
    required: true,
    default: "Generic",
  },
  desc: {
    type: String,
    requried: true,
    default: "",
  },
  MRP : {
    type : Number
  },
  sellingPrice : {
    type : Number
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  },
  hasVariation: { type: String, required: true },
  hsn: { type: String, required: true },
  "GST rate slab": {
    type: Number,
  },
  variants: [
    {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  ],
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
  statusAdmin: {
    type: Boolean,
    requried: true,
    default: true,
  },
  tags: [String],
  reviews: {
    averageRating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
  },
  timestamps: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
});

const businessSchema = new mongoose.Schema({
  RZPaccountId: {
    type: String,
    required: true,
  },
  RZPproductId: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  shopCategory: {
    type: String,
    required: true,
  },
  shopName: {
    type: String,
    required: true,
  },
  shopImage: {
    type: String,
    required: true,
  },
  shopLogo: {
    type: String,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  gst: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      requried: true,
    },
    coordinates: {
      type: [Number],
      reqruied: true,
    },
  },
  PANcard: {
    number: {
      type: String,
      requried: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  aadhaarcard: {
    number: {
      type: String,
      requried: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  inventoryAlert : {
    type : Number,
    required : true,
    default : 10
  },
  gst: {
    number: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  bankaccount: {
    number: {
      type: String,
      requried: true,
    },
    type: {
      type: String,
      requried: true,
    },
    ifsc: {
      type: String,
      requried: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  timings: {
    Mon: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Tue: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Wed: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Thu: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Fri: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Sat: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
    Sun: {
      status: { type: Boolean, required: true, default: false },
      from: { type: String, required: true, default: "00:00" },
      to: { type: String, required: true, default: "00:00" },
    },
  },
  products: [productSchema],
  bookings: [String],
  loyalty: [
    {
      code: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

businessSchema.methods.generateToken = async function () {
  try {
    const token = jwt.sign(
      { _id: this._id.toString() },
      process.env.SECRET_KEY
    );

    return token;
  } catch (error) {
    return error;
  }
};

businessSchema.index({
  "products.productName": "text",
  "products.category": "text",
  "products.subCategory": "text",
  location: "2dsphere",
});

const BusinessData = new mongoose.model("BusinessData", businessSchema);

module.exports = BusinessData;
