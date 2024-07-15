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
const businessSchema = new mongoose.Schema({
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
  gst: {
    number: {
      type: String,
      requried: true,
    },
    image: {
      type: String,
      required: true,
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
  products: [
    {
      productName: {
        type: String,
        required: true,
      },
      desc: {
        type: String,
        requried: true,
      },
      category: {
        type: String,
        required: true,
      },
      subCategory: {
        type: String,
        required: true,
      },
      sizes:{
        type : Object
      },
      sizesFootwear : {
        type : Object
        
      },
      condition: { type: String, required: true },
      brand: { type: String, default: "Generic" },
      price: { type: Number, required: true },
      MRP: { type: Number, reuired: true },
      discount: { type: Number, default: 0 },
      images: [String],
      colors: [String],
      hasVariation : {
        type : Boolean,
        requried : true
      },
      variations : {
        type : Object,
      },
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
    },
  ],
  loyalty : [{
    code : {
      type : String,
      required : true
    },
    amount : {
      type : Number,
      required : true
    }
  }],
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
