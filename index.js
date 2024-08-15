const express = require("express");

const axios = require("axios");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const Fuse = require("fuse.js");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Decimal128 } = mongoose.Types;
const crypto = require("crypto");
const { ObjectId } = mongoose.Types;
const port = process.env.PORT || 3000;
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://zooptiq.vercel.app",
    "https://www.zooptick.com",
    "https://www.zooptick.in",
  ],
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
};
const { uploadOnCloudinary } = require("./cloudinary.js");
const Razorpay = require("razorpay");
const RZ_KEY_ID = process.env.RAZORPAY_KEY_ID_PROD;
const RZ_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET_PROD;
const razorpayInstance = new Razorpay({
  key_id: RZ_KEY_ID,
  key_secret: RZ_KEY_SECRET,
});
const RZ_CREDENTIALS = Buffer.from(`${RZ_KEY_ID}:${RZ_KEY_SECRET}`).toString(
  "base64"
);

const UID = 40405678;
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
require("./db/conn");
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
const UserData = require("./models/users");
const admin = require("./models/admin");
const BusinessData = require("./models/business");
const OtpData = require("./models/otp");
const BookingsData = require("./models/bookings");
const PaymentData = require("./models/payment");
const auth = require("./middleware/auth");
const adminAuth = require("./middleware/adminAuth");
const businessAuth = require("./middleware/businessAuth");
const otpAuth = require("./middleware/otpAuth");
const { resolveSoa } = require("dns");
const { log } = require("console");

const ShortUniqueId = require("short-unique-id");
const uid = new ShortUniqueId({
  length: 8,
  dictionary: "alphanum_upper",
});

const ROLE_PERMISSIONS = {
  merchant: [""],
  admin: ["name", "email", "role"], // Admin can modify all fields
  user: ["name", "email"], // Regular user can modify only name and email
  guest: [], // Guest cannot modify any fields
};

const generateOtp = () => {
  return otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

const statesAndCities = {
  AndhraPradesh: [
    "Amaravati",
    "Guntur",
    "Kakinada",
    "Nellore",
    "Tirupati",
    "Vijayawada",
    "Visakhapatnam",
    "Vizianagaram",
  ],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun"],
  Assam: [
    "Dibrugarh",
    "Dispur",
    "Guwahati",
    "Jorhat",
    "Silchar",
    "Tezpur",
    "Tinsukia",
  ],
  Bihar: [
    "Arrah",
    "Bhagalpur",
    "Bihar Sharif",
    "Darbhanga",
    "Gaya",
    "Muzaffarpur",
    "Patna",
    "Purnia",
  ],
  Chhattisgarh: [
    "Bhilai",
    "Bilaspur",
    "Durg",
    "Korba",
    "Raipur",
    "Rajnandgaon",
  ],
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
  Goa: ["Margao", "Mapusa", "Panaji", "Ponda", "Vasco da Gama"],
  Gujarat: [
    "Ahmedabad",
    "Bhavnagar",
    "Gandhinagar",
    "Jamnagar",
    "Rajkot",
    "Surat",
    "Vadodara",
  ],
  Haryana: [
    "Ambala",
    "Faridabad",
    "Gurgaon",
    "Hisar",
    "Karnal",
    "Panipat",
    "Rohtak",
  ],
  "Himachal Pradesh": [
    "Bilaspur",
    "Dharamshala",
    "Hamirpur",
    "Kullu",
    "Mandi",
    "Shimla",
    "Solan",
  ],
  Jharkhand: [
    "Bokaro",
    "Deoghar",
    "Dhanbad",
    "Hazaribagh",
    "Jamshedpur",
    "Ranchi",
  ],
  Karnataka: [
    "Bengaluru",
    "Belagavi",
    "Bellary",
    "Hubballi",
    "Kalaburagi",
    "Mangaluru",
    "Mysuru",
    "Shivamogga",
  ],
  Kerala: [
    "Alappuzha",
    "Ernakulam",
    "Kollam",
    "Kozhikode",
    "Thiruvananthapuram",
    "Thrissur",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Gwalior",
    "Indore",
    "Jabalpur",
    "Rewa",
    "Sagar",
    "Ujjain",
  ],
  Maharashtra: [
    "Aurangabad",
    "Mumbai",
    "Nagpur",
    "Nashik",
    "Pune",
    "Solapur",
    "Thane",
  ],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Dimapur", "Kohima"],
  Odisha: ["Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur"],
  Punjab: [
    "Amritsar",
    "Bathinda",
    "Chandigarh",
    "Jalandhar",
    "Ludhiana",
    "Patiala",
  ],
  Rajasthan: ["Ajmer", "Bikaner", "Jaipur", "Jodhpur", "Kota", "Udaipur"],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Salem",
    "Tiruchirappalli",
    "Tirunelveli",
    "Vellore",
  ],
  Telangana: ["Hyderabad", "Karimnagar", "Khammam", "Nizamabad", "Warangal"],
  Tripura: ["Agartala"],
  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Allahabad",
    "Bareilly",
    "Ghaziabad",
    "Gorakhpur",
    "Kanpur",
    "Lucknow",
    "Meerut",
    "Varanasi",
  ],
  Uttarakhand: ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Roorkee"],
  "West Bengal": ["Asansol", "Durgapur", "Howrah", "Kolkata", "Siliguri"],
};
const phoneRegex = /^(\+91|\+91\-|0)?[7896]\d{9}$/;
const PRODUCT_FORM_CONFIG = {
  Clothing: {
    "Product Information": [
      {
        name: "productName",
        label: "Product Name",
        type: "text",
        required: true,
        schema: {
          required: { value: true, message: "Product name is required" },
          minLength: {
            value: 2,
            message: "Should be at least of 2 characters",
          },
          maxLength: {
            value: 70,
            message: "Maximum 70 characters are allowed",
          },
        },
      },
      {
        name: "subCategory",
        label: "Sub Category",
        type: "text",
        required: true,
        schema: {
          required: { value: true, message: "Sub Category is required" },
          minLength: {
            value: 2,
            message: "Should be at least of 2 characters",
          },
          maxLength: {
            value: 70,
            message: "Maximum 70 characters are allowed",
          },
        },
      },
      {
        name: "brand",
        label: "Brand",
        type: "text",
        required: true,
        schema: {
          required: { value: true, message: "Brand name is required" },
          minLength: {
            value: 2,
            message: "Should be at least of 2 characters",
          },
          maxLength: {
            value: 70,
            message: "Maximum 70 characters are allowed",
          },
        },
      },
      {
        name: "MRP",
        label: "MRP",
        type: "number",
        required: true,
        schema: {
          required: { value: true, message: "MRP is requried" },
          min: { value: 1, message: "Minimum amount is Rs 1.00" },
          max: { value: 100000, message: "Maximum amount is Rs 100000.00" },
          valueAsNumber: true,
        },
      },
      {
        name: "sellingPrice",
        label: "Selling Price",
        type: "number",
        required: true,
        schema: {
          required: { value: true, message: "Selling price is requried" },
          min: { value: 1, message: "Minimum amount is Rs 1.00" },
          max: { value: 100000, message: "Maximum amount is Rs 100000.00" },
          valueAsNumber: true,
        },
      },
    ],
    "Variation Details": [
      {
        name: "hasVariation",
        label: "Does this product have variations?",
        type: "radio",
        options: ["Yes", "No"],
        rquired: true,
        schema: {
          required: { value: true, message: "Please choose an option" },
        },
      },
      {
        name: "selectedVariations",
        label: "",
        type: "checkbox",
        options: ["Size", "Color", "MaterialType"],
        required: false,
        dependsOn: { field: "hasVariation", value: "Yes" },
        validation: (getValues) => {
          return {
            validate: (value) => {
              const shouldValidate = getValues("hasVariation");
              if (shouldValidate === "Yes" && value.length < 1) {
                return "At least select one variation";
              }
              return true;
            },
            deps: ["hasVariation"],
          };
        },
      },
      {
        name: "variationSize",
        label: "",
        placeholder: "Size",
        subType: "Text-Array",
        type: "text",
        requried: false,
        dependsOn: { field: "selectedVariations", value: "Size" },
      },
      {
        name: "variationColor",
        label: "",
        placeholder: "Color",
        subType: "Text-Array",
        type: "text",
        requried: false,
        dependsOn: { field: "selectedVariations", value: "Color" },
      },
      {
        name: "variationMaterialType",
        label: "",
        placeholder: "Material Type",
        subType: "Text-Array",
        type: "text",
        requried: false,
        dependsOn: { field: "selectedVariations", value: "MaterialType" },
      },
    ],
    Variations: {
      Size: [
        {
          name: "Target Gender",
          label: "Target Gender",
          placeholder: "Target Gender",
          type: "select",
          options: ["Male", "Female", "Unisex"],
          required: true,
          schema: {
            required: { value: true, message: "Please choose an option" },
          },
        },
        {
          name: "Size Age Group",
          label: "Size Age Group",
          placeholder: "Size Age Group",
          type: "select",
          options: ["Adult", "Big Kid", "Little Kid", "Toddler", "Infant"],
          required: true,
          schema: {
            required: { value: true, message: "Please choose an option" },
          },
        },
      ],
      Color: [
        {
          name: "Color Map",
          label: "Color Map",
          placeholder: "Color Map",
          type: "select",
          options: ["Red", "Blue", "Green"],
          required: true,
          schema: {
            required: { value: true, message: "Please choose an option" },
          },
        },
      ],
      Common: [
        {
          name: "Condition",
          placeholder: "Condition",
          label: "Condition",
          type: "select",
          options: ["New", "Used"],
          required: true,
          schema: {
            required: { value: true, message: "Please choose an option" },
          },
        },
        {
          name: "SKU",
          placeholder: "SKU",
          label: "SKU",
          type: "text",
          required: true,
          schema: {
            required: { value: true, message: "SKU is requried" },
          },
        },
        {
          name: "MRP",
          label: "MRP",
          placeholder: "MRP",
          type: "number",
          required: true,
          schema: {
            required: { value: true, message: "MRP is requried" },
            min: { value: 1, message: "Minimum amount is Rs 1.00" },
            max: { value: 100000, message: "Maximum amount is Rs 100000.00" },
            valueAsNumber: true,
          },
        },
        {
          name: "sellingPrice",
          label: "Selling Price",
          placeholder: "Selling Price",
          type: "number",
          required: true,
          schema: {
            required: { value: true, message: "Selling price is requried" },
            min: { value: 1, message: "Minimum amount is Rs 1.00" },
            max: { value: 100000, message: "Maximum amount is Rs 100000.00" },
            valueAsNumber: true,
          },
        },
        {
          name: "Stock",
          placeholder: "Stock",
          label: "Stock",
          type: "number",
          required: true,
          schema: {
            required: { value: true, message: "Stock is requried" },
            valueAsNumber: true,
          },
        },
        {
          name: "Images",
          placeholder: "Product Image",
          label: "Product Image",
          type: "file",
          accept: "image/*",
          rquired: true,
        },
      ],
    },
    "Tax Details": [
      {
        name: "hsn",
        label: "HSN",
        type: "text",
        requried: true,
        schema: {
          required: { value: true, message: "HSN code is required" },
        },
      },
      {
        name: "GST rate slab",
        label: "GST rate slab %",
        type: "select",
        options: [0, 3, 5, 12, 18, 28],
        requried: true,
        schema: {
          required: { value: true, message: "Please choose an option" },
        },
      },
    ],
  },
  Footwear: {
    fields: [
      {
        name: "productName",
        label: "Product Name",
        type: "text",
        required: true,
      },
      { name: "price", label: "Price", type: "number", required: true },
      {
        name: "hasVariations",
        label: "Does this product have variations?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
    ],
    variationOptions: [
      { name: "size", label: "Size", type: "checkbox", required: false },
      { name: "color", label: "Color", type: "checkbox", required: false },
      {
        name: "materialType",
        label: "Material Type",
        type: "checkbox",
        required: false,
      },
    ],

    variationFields: {
      size: {
        name: "size",
        label: "Size",
        type: "select",
        options: ["6", "7", "8", "9", "10"],
        required: true,
      },
      color: {
        name: "color",
        label: "Color",
        type: "select",
        options: ["Red", "Blue", "Black"],
        required: true,
      },
      materialType: {
        name: "materialType",
        label: "Material Type",
        type: "select",
        options: ["Leather", "Synthetic"],
        required: true,
      },
      stock: { name: "stock", label: "Stock", type: "number", required: true },
    },
  },
  "General Store": {
    fields: [
      {
        name: "productName",
        label: "Product Name",
        type: "text",
        required: true,
      },
      { name: "price", label: "Price", type: "number", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: false,
      },
    ],
  },
};
const ONBOARD_FORM_CONFIG = {
  "Basic Information": [
    {
      name: "ownerName",
      label: "Your Name*",
      type: "text",
      required: true,
      schema: {
        dataType: {
          condition: "string",
          error: "It must only contain letters",
        },
        required: { condition: true, error: "Your name is requried" },
        minLength: {
          condition: 2,
          error: "Minimum length should be 2 characters",
        },
        maxLength: { condition: 20, error: "Only 20 charcters are allowed" },
      },
    },
    {
      name: "shopName",
      label: "Shop Name*",
      type: "text",
      required: true,
      schema: {
        dataType: {
          condition: "string",
          error: "It must only contain letters",
        },
        required: { condition: true, error: "Shop name is required" },
        minLength: {
          condition: 2,
          error: "Minimum length should be 2 characters",
        },
        maxLength: { condition: 30, error: "Only 30 charcters are allowed" },
      },
    },
    {
      name: "contactNumber",
      label: "Contact Number*",
      type: "tel",
      required: true,
      schema: {
        dataType: {
          condition: "string",
          error: "It must only contain numbers",
        },
        required: { condition: true, error: "Contact number is required" },
        matches: {
          with: phoneRegex.source,
          error: "Contact number is invalid",
        },
      },
    },
    {
      name: "email",
      label: "E-Mail*",
      type: "email",
      required: true,
      schema: {
        dataType: {
          condition: "email",
          error: "Invalid Email",
        },
        required: { condition: true, error: "Email is required" },
      },
    },
    {
      name: "address",
      label: "Shop Address*",
      type: "text",
      required: true,
      schema: {
        dataType: {
          condition: "string",
          error: "It must only contain letters",
        },
        required: { condition: true, error: "Shop address is required" },
        minLength: {
          condition: 10,
          error: "Minimum length should be 2 characters",
        },
        maxLength: { condition: 150, error: "Only 60 charcters are allowed" },
      },
    },
    {
      name: "state",
      label: "State*",
      type: "select",
      required: true,
      options: Object.keys(statesAndCities),
      schema: {
        required: { condition: true, error: "Please select state" },
      },
    },
    {
      name: "city",
      label: "City*",
      type: "select",
      required: true,
      depends: {
        on: "state",
        with: statesAndCities,
      },
      options: [],
      schema: {
        required: { condition: true, error: "Please select state" },
      },
    },
  ],
  "Business Information": [
    {
      name: "shopCategory",
      label: "Shop Category*",
      type: "select",
      options: ["Clothing", "Footwear"],
      required: true,
      schema: {
        required: { condition: true, error: "Please select shop category" },
      },
    },
    {
      name: "onGoogleMaps*",
      label: "Is your store listed on google maps?*",
      type: "radio",
      options: ["Yes", "No"],
      required: true,
      schema: {
        required: { condition: true, error: "Please choose an option" },
      },
    },
    {
      name: "shopImage",
      label: "Shop Image*",
      type: "file",
      accept: "image/*",
      required: true,
      schema: {
        dataType: {
          condition: "mixed",
        },
        required: { condition: true, error: "Shop image is required" },
      },
    },
    {
      name: "shopLogo",
      label: "Shop Logo",
      type: "file",
      accept: "image/*",
      required: false,
      schema: {
        dataType: {
          condition: "mixed",
        },
        required: { condition: false },
      },
    },
  ],
  "Documents & Bank Details": {
    "PAN DETAILS": [
      {
        name: "PANcard.number",
        label: "PAN number*",
        type: "text",
        required: true,
        schema: {
          dataType: {
            condition: "string",
            error: "It must only contain letters",
          },
          required: { condition: true, error: "PAN number is required" },
        },
      },
      {
        name: "PANcard.image",
        label: "PAN image*",
        type: "file",
        accept: "image/*",
        required: true,
        schema: {
          dataType: {
            condition: "mixed",
          },
          required: { condition: true, error: "PAN image is required" },
        },
      },
    ],
    "AADHAAR CARD DETAILS": [
      {
        name: "aadhaarcard.number",
        label: "Aadhaar number*",
        type: "number",
        required: true,
        schema: {
          dataType: {
            condition: "number",
            error: "It must only contain number",
          },
          required: { condition: true, error: "Aadhaar number is required" },
        },
      },
      {
        name: "aadhaarcard.image",
        label: "Aadhaar card image*",
        type: "file",
        accept: "image/*",
        required: true,
        schema: {
          dataType: {
            condition: "mixed",
          },
          required: { condition: true, error: "Aadhaar image is required" },
        },
      },
    ],
    "GST CERTIFICATE DETAILS": [
      {
        name: "gst.number",
        label: "GST number",
        type: "text",
        required: false,
        schema: {
          dataType: {
            condition: "string",
            error: "It must only contain letters",
          },
          required: { condition: false, error: "GST number is required" },
        },
      },
      {
        name: "gst.image",
        label: "GST certificate image",
        type: "file",
        accept: "image/*",
        required: false,
        schema: {
          dataType: {
            condition: "mixed",
          },
          required: {
            condition: false,
            error: "GST certiificate image is required",
          },
        },
      },
    ],
    "BANK ACCOUNT DETAILS": [
      {
        name: "bankaccount.number",
        label: "Bank account number*",
        type: "text",
        required: true,
        schema: {
          dataType: {
            condition: "string",
            error: "It must only contain letters",
          },
          required: {
            condition: true,
            error: "Bank account number is required",
          },
        },
      },
      {
        name: "bankaccount.ifsc",
        label: "IFSC code*",
        type: "text",
        required: true,
        schema: {
          dataType: {
            condition: "string",
            error: "It must only contain letters",
          },
          required: {
            condition: true,
            error: "IFSC code is required",
          },
        },
      },
      {
        name: "bankaccount.type",
        label: "Bank account type*",
        type: "select",
        options: ["Savings", "Current"],
        required: true,
        schema: {
          required: { condition: true, error: "Please select account type" },
        },
      },
      {
        name: "bankaccount.image",
        label: "Passbook image*",
        type: "file",
        accept: "image/*",
        required: true,
        schema: {
          dataType: {
            condition: "mixed",
          },
          required: { condition: true, error: "Passbook image is required" },
        },
      },
    ],
  },
};

const PRODUCTS_DATA = {
  Footwear: {
    Men: [
      "Causal Shoes",
      "Formal Shoes",
      "Sports Shoes",
      "Sneakers",
      "Flip Flop/Slippers",
      "Boots",
      "Loafers",
      "Crocs",
      "Juti",
      "Ethnic",
      "Accessories > Socks",
      "Accessories > Insoles",
      "Accessories > Spectacles > Sunglasses",
    ],
    Women: [
      "Gladiators",
      "Heels",
      "Mules",
      "Loafers",
      "Boots",
      "Sneakers",
      "Sports Shoes",
      "Casual Shoes",
      "Formal Shoes",
      "Slider",
      "Slipper",
      "Slip-on",
      "CLogs",
      "Crocs",
      { Accessories: ["Socks", "Insoles"] },
    ],
    Kids: {
      Boys: [
        "School Shoes",
        "Sports Shoes",
        "Flats",
        "Sandals",
        "Sneakers",
        "Flip Flops",
        "Slippers",
        { Accessories: ["Socks", "Insoles"] },
      ],
      Girls: [
        "School Shoes",
        "Sports Shoes",
        "Flats",
        "Sandals",
        "Sneakers",
        "Flip Flops",
        "Slippers",
        { Accessories: ["Socks", "Insoles"] },
      ],
    },
  },
  Clothing: {
    Men: ["Tshirt"],
  },
};
let CACHED_PRODUCTS_DATA = [];
let collections;
let fuseIndex;
const fetchDataFromDB = async () => {
  try {
    collections = await BusinessData.find({}).lean();
    CACHED_PRODUCTS_DATA = collections
      .map((collection) => collection.products)
      .flat();
    // const myIndex = Fuse.createIndex(
    //   ["productName", "subCategory"],
    //   CACHED_PRODUCTS_DATA
    // );
    // Serialize and save it
    // fs.writeFileSync(
    //   "fuse-index.json",
    //   JSON.stringify(myIndex.toJSON()),
    //   (err) => console.log(err)
    // );
    // fuseIndex = require("./fuse-index.json");
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
  }
};

// Fetch data initially and then at regular intervals (e.g., every 5 minutes)
fetchDataFromDB();
setInterval(fetchDataFromDB, 2 * 60 * 1000);

function formatPrice(amount) {
  // Convert the amount to a string with two decimal places
  return amount.toFixed(2);
}
function generateOrderId(prefix = 'order_', length = 14) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return prefix + randomString;
}

function addQuoteBeforeEachWord(str) {
  return str
    .trim()
    .split(" ") // Split the string by spaces into an array of words
    .map((word) => `'${word}`) // Add a single quote before each word
    .join(" "); // Join the array back into a string
}

const PAGINATION_LIMIT = 7;
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "zooptickofficial@gmail.com",
    pass: "krds slmo jjgd smex",
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp"); // Destination folder for file uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Rename files with timestamp
  },
});

const limits = {
  fileSize: 1024 * 1024 * 5, // 5 MB limit
};
const upload = multer({ storage, limits });

function deleteFiles(files) {
  // Delete uploaded files if condition fails
  files.forEach((file) => {
    const filePath = path.join(__dirname, file.path);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted:", filePath);
      }
    });
  });
}

app.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (email === "") {
      return res.status(500).send("Please provide Email");
    }
    const user = await UserData.findOne({ email });
    if (!user) {
      return res.status(404).send("User does not exist");
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; //1 hour
    await user.save();
    transporter
      .sendMail({
        from: "Zooptick <zooptickofficial@gmail.com>",
        to: user.email,
        subject: "Reset Password",
        html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:100%;overflow:auto;line-height:2">
<div style="margin:50px auto;width:70%;padding:20px 0">
  <div style="border-bottom:1px solid #eee">
    <a href="" style="font-size:1.4em;color: #a885e8;text-decoration:none;font-weight:600">Zooptick</a>
  </div>
  <p style="font-size:1.1em">Hi ${user.name}</p>
  <p>We received a request to reset your password. Click the button below to reset it.</p>
  <a target="_blank" href="https://www.zooptick.com/reset-password/${token}" style="display : block;background: #a885e8;margin:2rem auto;width: max-content;padding: 10px;color: #fff;border-radius: 4px;">Reset Password</a>
      <p >If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
            <p style="margin-top:2rem;">Team Zooptick</p>
  <hr style="border:none;border-top:1px solid #eee" />
</div>
</div>`,
      })
      .then(() => {
        res.status(200).send("Email is sent containing reset link");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } catch (error) {
    next(error);
  }
});

app.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await UserData.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired");
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    console.log(user);
    await user.save();
    res.status(200).send("Password has been reset");
  } catch (error) {
    next(error);
  }
});

app.get("/verify-user", async (req, res) => {
  try {
    const otp = generateOtp();
    const newOtp = new OtpData({
      otp,
      email: req.query.email,
    });
    const token = await newOtp.generateToken();
    res.cookie("otp", token, {
      expires: new Date(Date.now() + 5 * 60 * 1000),
      httpOnly: true,
    });
    await newOtp.save();
    transporter
      .sendMail({
        from: "Zooptick <zooptickofficial@gmail.com>",
        to: req.query.email,
        subject: "Email Verification",
        html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #a885e8;text-decoration:none;font-weight:600">Zooptick</a>
    </div>
    <p style="font-size:1.1em">Hi,</p>
    <p>Thank you for choosing Zooptick. Use the following OTP to complete the signup verification. OTP is valid for 5 minutes. Do not share this OTP with anyone.</p>
    <h2 style="background: #a885e8;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
    <p style="font-size:0.9em;">Regards,<br />Zooptick</p>
    <hr style="border:none;border-top:1px solid #eee" />
  </div>
</div>`,
      })
      .then(() => {
        res.status(200).send("Success");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } catch (error) {
    res.status(500).send(err);
  }
});
app.post("/verify-user", otpAuth, async (req, res) => {
  try {
    if (req.token) {
      if (req.body.otp == req.user.otp) {
        const otpDoc = await OtpData.findByIdAndUpdate(
          { _id: req.user.id },
          {
            isVerified: true,
          }
        );
        await otpDoc.save();
        res.status(200).send("Success");
      } else {
        res.status(401).send("Invalid OTP");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    res.send(error);
  }
});

app.post("/signup", otpAuth, async (req, res) => {
  try {
    if (req.token) {
      if (req.user.isVerified) {
        const emailExist = await UserData.find({ email: req.user.email });
        if (emailExist.length > 0) {
          res.status(401).send("Email Already Exist");
        } else {
          const newUser = new UserData({
            email: req.user.email,
            name: req.body.name,
            password: req.body.password,
            role: "user",
          });
          await newUser.save();
          const token = await newUser.generateToken();
          res.cookie("jwt", token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
          });
          res.status(200).send({ ...newUser, password: null });
        }
      } else {
        res.status(401).send("Unauthourized");
      }
    } else {
      res.status(401).send("Unauthourized");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserData.findOne({ email });
    if (user) {
      const passMatch = await bcrypt.compare(password, user.password);
      if (passMatch) {
        const token = await user.generateToken();
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        });
        res.status(200).send("Login Successfull");
      } else {
        res.status(401).send("Invalid Credentials");
      }
    } else {
      res.status(404).send("User does not Exist");
    }
  } catch (error) {
    next(error);
  }
});
app.get("/userAuth", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const { name, email, role } = req.user;
      res.status(200).send({
        name,
        email,
        role,
        storeId: req.user.storeId ? req.user.storeId : undefined,
        registeredForStore: req.user.registeredForStore
          ? req.user.registeredForStore
          : undefined,
        wishlist: req.user.wishlist || [],
      });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/logout", (req, res) => {
  res.clearCookie("jwt", {});
  res.status(200).send({ message: "Logged out" });
});

app.get("/login-merchant", businessAuth, async (req, res) => {
  try {
    const user = await BusinessData.findOne({
      _id: "66276c29c31e1a59a3845026",
    });
    console.log(user);
    const token = await user.generateToken();
    console.log({ token });
    res.cookie("business", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    });
    res.send(true);
  } catch (error) {
    res.send(error);
  }
});
// app.get("/", auth, async (req, res) => {
//   try {
//     if (req.token) {
//       res.send("LOGGED");
//     } else {
//       const newUser = new UserData({
//         name: "Adnan Quazi",
//         email: "quaziadaasndn12352@gmail.com",
//         password: "123456",
//       });

//       const token = await newUser.generateToken();
//       console.log(token);
//       res.cookie("jwt", token, {
//         expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//         httpOnly: true,
//       });
//       await newUser.save();
//       res.send(true);
//     }
//   } catch (error) {
//     console.log(error);
//     res.send(error);
//   }
// });

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const getProductsWithinDistance = (userLat, userLon, products, maxDistance) => {
  return products.filter((product) => {
    const distance = calculateDistance(
      userLat,
      userLon,
      product.lat,
      product.long
    );
    return distance <= maxDistance;
  });
};
function isStoreOpen(timings) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Get the current local time
  const now = new Date();
  
  // Convert current local time to IST (UTC+5:30)
  const utcOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + utcOffset + istOffset);

  const dayName = days[istTime.getDay()];
  const currentDayTiming = timings[dayName];

  if (!currentDayTiming.status) {
    return false; // The store is closed today.
  }

  // Convert current time to minutes since midnight
  const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();
  
  // Convert store opening and closing times to minutes since midnight
  const [fromHours, fromMinutes] = currentDayTiming.from.split(':').map(Number);
  const fromMinutesTotal = fromHours * 60 + fromMinutes;

  const [toHours, toMinutes] = currentDayTiming.to.split(':').map(Number);
  const toMinutesTotal = toHours * 60 + toMinutes;
  
  // Check if the current time is within the store's open hours
  if (fromMinutesTotal <= currentMinutes && currentMinutes < toMinutesTotal) {
    return true; // The store is open now.
  }

  return false; // The store is closed now.
}

app.get("/search-stores" , async(req,res,next) => {
  try{
    const {search} = req.query
    if(!search) res.status(404).send({message : "No store found"})
    const options = {
      includeScore: true,
      shouldSort: true,
      useExtendedSearch: true,
      keys: [{ name: "shopName", weight: 3 }],
    };
    const fuse = new Fuse(collections, options);
    let modifiedString = addQuoteBeforeEachWord(search);
    const result = fuse.search({
      $or: [
        { shopName: modifiedString },
        { shopName: search },
      ],
    });
    console.log(result[0].item.location.coordinates)
    let stores = result.map(({ item: { shopName, shopLogo , shopImage , address , contactNumber , timings , location , _id} }) => ({ _id , shopName, shopLogo , shopImage , address , contactNumber , storeOpen : isStoreOpen(timings) , location : location.coordinates}))
    res.send(stores)
  }catch(error){
    next(error)
  }
})

app.get("/getProducts", auth, async (req, res, next) => {
  try {
    const filter = {};
    let brands = [];
    let subCategories = [];
    let {
      mode,
      search,
      pageParam,
      rating,
      subCategory,
      brand,
      price,
      city,
      lat,
      long,
      maxDistance,
    } = req.query;
    maxDistance = parseInt(maxDistance);
    // subCategory = subCategory.split(",").filter((item) => item.trim() !== "");

    // subCategory = subCategory
    //   .split(",")
    //   .filter((item) => item.trim() !== "");

    let page = parseInt(pageParam);
    let skip = (page - 1) * PAGINATION_LIMIT;
    let limit = skip + PAGINATION_LIMIT;
    let documentID;
    if (mode === "merchant") {
      documentID = req.user?.storeId || "";
    }
    if (mode === "store") {
      documentID = req.query.storeId;
    }
    let finalResult;

    const options = {
      includeScore: true,
      shouldSort: true,
      useExtendedSearch: true,
      keys: [{ name: "productName", weight: 3 }, "subCategory"],
    };

    let productsData = [];
    if (collections.length < 1) {
      return res.status(500).send("Data not loaded");
    }
    if (documentID) {
      for (let i = 0; i < collections.length; i++) {
        if (collections[i]._id == documentID) {
          collections[i].products.map((elem) => {
            productsData.push({
              ...elem,
              address: collections[i].address,
              city: collections[i].city,
              contactNumber: collections[i].contactNumber,
              email: collections[i].email,
              soldBy: collections[i].shopName,
              lat: collections[i].location.coordinates[0],
              long: collections[i].location.coordinates[1],
            });
          });
          break;
        }
      }
    } else if (city) {
      for (let i = 0; i < collections.length; i++) {
        if (collections[i].city == city) {
          collections[i].products.map((elem) => {
            productsData.push({
              ...elem,
              address: collections[i].address,
              city: collections[i].city,
              contactNumber: collections[i].contactNumber,
              email: collections[i].email,
              soldBy: collections[i].shopName,
              lat: collections[i].location.coordinates[0],
              long: collections[i].location.coordinates[1],
            });
          });
          // productsData = [...productsData , ...collections[i].products];
        }
      }
    } else {
      for (let i = 0; i < collections.length; i++) {
        collections[i].products.map((elem) => {
          productsData.push({
            ...elem,
            address: collections[i].address,
            city: collections[i].city,
            contactNumber: collections[i].contactNumber,
            email: collections[i].email,
            soldBy: collections[i].shopName,
            lat: collections[i].location.coordinates[0],
            long: collections[i].location.coordinates[1],
          });
        });
        // productsData = [...productsData , ...collections[i].products];
      }
    }

    if (search !== "") {
      const fuse = new Fuse(productsData, options);
      let modifiedString = addQuoteBeforeEachWord(search);
      const result = fuse.search({
        $or: [
          { productName: modifiedString },
          { subCategory: modifiedString },
          { productName: search },
          { subCategory: search },
        ],
      });
      finalResult = result.map((elem) => elem.item);
    } else {
      finalResult = productsData;
    }

    console.log(finalResult);

    if (mode !== "merchant") {
      brand = brand.split(",").filter((item) => item.trim() !== "");
      subCategory = subCategory.split(",").filter((item) => item.trim() !== "");
      brands = [...new Set(finalResult.map((item) => item.brand))];
      subCategories = [...new Set(finalResult.map((item) => item.subCategory))];
    }

    if (Array.isArray(brand) && brand.length > 0) {
      finalResult = finalResult.filter((product) =>
        brand.includes(product.brand)
      );
    }
    if (Array.isArray(subCategory) && subCategory.length > 0) {
      finalResult = finalResult.filter((product) =>
        subCategory.includes(product.subCategory)
      );
    }

    if (maxDistance <= 50 && maxDistance >= 1) {
      finalResult = getProductsWithinDistance(
        lat,
        long,
        finalResult,
        maxDistance
      );
    }
    if (lat && long) {
      finalResult = finalResult.sort((a, b) => {
        const distanceA = calculateDistance(lat, long, a.lat, a.long);
        const distanceB = calculateDistance(lat, long, b.lat, b.long);
        return distanceA - distanceB;
      });
    }
    if (rating === "true") {
      finalResult.sort(
        (a, b) => b.reviews.averageRating - a.reviews.averageRating
      );
    }
    if(mode === "merchant"){
      finalResult = finalResult.sort((a, b) => new Date(b.timestamps.updatedAt) - new Date(a.timestamps.updatedAt))
    }
    const data = finalResult.slice(skip, limit);

    res.status(200).json({
      products: data,
      brands,
      subCategories,
      totalProducts: finalResult.length,
      showing: limit > finalResult.length ? finalResult.length : limit,
      skip,
      nextPage: limit >= finalResult.length ? undefined : page + 1,
    });
  } catch (error) {
    next(error);
  }
});
const processFilesAndMergeWithBody = async (files, body) => {
  const uploadPromises = files.map(async (file) => {
    const { fieldname, path } = file;
    try {
      const url = await uploadOnCloudinary(path);
      // Store the URL in the structure matching fieldname
      const keys = fieldname.match(/[^\[\]]+/g); // Extract keys from fieldname
      keys.reduce((acc, key, index) => {
        const isLastKey = index === keys.length - 1;
        const isArrayIndex = !isNaN(key);

        if (isLastKey) {
          if (isArrayIndex) {
            if (!Array.isArray(acc)) acc = [];
            acc[Number(key)] = url;
          } else {
            acc[key] = url;
          }
        } else {
          if (isArrayIndex) {
            if (!acc[key]) acc[key] = [];
            return acc[key];
          } else {
            if (!acc[key]) acc[key] = {};
            return acc[key];
          }
        }
      }, body);
    } catch (error) {
      console.error(`Failed to upload file ${file.originalname}: `, error);
    }
  });

  await Promise.all(uploadPromises);

  return body;
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    return isNaN(part) ? acc[part] : acc[parseInt(part, 10)];
  }, obj);
};

app.get("/product/config", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const {category} = req.query
      res.status(200).send(PRODUCT_FORM_CONFIG[category]);
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});


app.post("/addProduct", auth, upload.any(), async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const productData = Object.assign(req.body);
      if (!req.body.variants || !Array.isArray(req.body.variants)) {
        req.body.variants = [];
      } else {
        req.body.variants = req.body.variants.map(variant => ({
          ...variant,
          Images: Array.isArray(variant.Images) ? variant.Images : []
        }));
      }
      
      const updatedBody = await processFilesAndMergeWithBody(req.files, req.body);
      updatedBody.variants.forEach((variant,index)=> {
        const path = variant.sharedImagePath;
        updatedBody.variants[index]._id = new mongoose.Types.ObjectId()
        const MRP = parseFloat(variant.MRP).toFixed(2);
        const sellingPrice = parseFloat(variant.sellingPrice).toFixed(2);
        const inclusiveTax = parseFloat((variant.sellingPrice * updatedBody["GST rate slab"]) / 100).toFixed(2);

        updatedBody.variants[index].MRP = MRP
        updatedBody.variants[index].sellingPrice = sellingPrice
        updatedBody.variants[index].inclusiveTax = inclusiveTax
        if(path != "upload"){
          const sharedImage = getNestedValue(updatedBody, path);
          updatedBody.variants[index].Images = sharedImage
          console.log(sharedImage);
        }
      }); 
      
      // function toCapitalizedWords(str) {
      //   return str
      //     .trim() // Remove extra spaces at the beginning and end
      //     .split(" ") // Split the string into words
      //     .map(
      //       (word) =>
      //         word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      //     ) // Capitalize the first letter of each word
      //     .join(" "); // Join the words back into a single string with spaces
      // }

      // const body = req.body;
      // const files = req.files.map((file) => uploadOnCloudinary(file.path));
      // const uploadedUrls = await Promise.all(files);
      // const parsedData = {};

      // for (let key in body) {
      //   parsedData[key] = JSON.parse(body[key]);
      // }
      // parsedData.colors = parsedData.colors.map((elem) =>
      //   toCapitalizedWords(elem)
      // );

      const product = await BusinessData.updateOne(
        { _id: req.user.storeId },
        { $push: { products: {...updatedBody} } }
      );

      if (product.acknowledged) {
        res.status(200).send("Product Added Succesfully");
      } else {
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.status(401).send("Auth Failed");
    }
  } catch (error) {
    next(error);
  }
});
app.put("/updateProduct", auth, async (req, res) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const updatedProduct = { ...req.body.product };
      const filter = req.body.id;
      const update = {};
      for (const [key, value] of Object.entries(updatedProduct)) {
        if (key === "statusAdmin") return;
        update[`products.$[elem].${key}`] = value;
      }
      const result = await BusinessData.updateOne(
        { _id: req.user.storeId },
        { $set: update },
        { arrayFilters: [{ "elem._id": filter }] }
      );
      fetchDataFromDB();
      res.status(200).send(true);
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    res.send(error);
  }
});

app.get("/product", async (req, res, next) => {
  const productId = req.query._id;

  try {
    // if (!mongoose.Types.ObjectId.isValid(productId)) {
    //   return res.status(400).json({ error: 'Invalid product ID format' });
    // }

    const result = await BusinessData.findOne(
      { "products._id": productId },
      { "products.$": 1 , "shopName" : 1 , _id : 1 , address : 1 , contactNumber : 1 , shopImage : 1 , shopLogo : 1},
    ).lean();
    console.log(result)
    if (!result || result.products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const response = {
      ...result.products[0],
      storeId: result._id,  // Assign _id to storeId
      shopName: result.shopName,
      address: result.address,
      contactNumber: result.contactNumber,
      shopImage: result.shopImage,
      shopLogo: result.shopLogo,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});
app.put(
  "/editProduct",
  auth,
  upload.any(),
  async (req, res, next) => {
    try {
      if (req.token && req.user.role === "merchant" && req.user.storeId) {
        if (!req.body.variants || !Array.isArray(req.body.variants)) {
          req.body.variants = [];
        } else {
          req.body.variants = req.body.variants.map(variant => ({
            ...variant,
            NewImages: Array.isArray(variant.NewImages) ? variant.NewImages : []
          }));
        }

        const updatedBody = await processFilesAndMergeWithBody(req.files, req.body);
        console.log(updatedBody)
        updatedBody.variants.forEach((variant,index)=> {
          const path = variant.sharedImagePath;
          const MRP = parseFloat(variant.MRP).toFixed(2);
          const sellingPrice = parseFloat(variant.sellingPrice).toFixed(2);
          const inclusiveTax = parseFloat((variant.sellingPrice * updatedBody["GST rate slab"]) / 100).toFixed(2);

          updatedBody.variants[index].MRP = MRP
          updatedBody.variants[index].sellingPrice = sellingPrice
          updatedBody.variants[index].inclusiveTax = inclusiveTax

          if(variant.NewImages.length > 0){
            updatedBody.variants[index].Images = [...variant.Images , ...variant.NewImages]
            delete updatedBody.variants[index]["NewImages"]
          }
          if(path != "upload"){
            const sharedImage = getNestedValue(updatedBody, path);
            updatedBody.variants[index].Images = sharedImage
          }
        }); 
        const filter = req.body._id;
        const update = {};

        for (const [key, value] of Object.entries(updatedBody)) {
          if (key === "statusAdmin" || key === "_id") continue;
          update[`products.$[elem].${key}`] = value;
        }
        const result = await BusinessData.updateOne(
          { _id: req.user.storeId },
          { $set: update},
          { arrayFilters: [{ "elem._id": filter }] }
        );
        fetchDataFromDB();
        res.status(200).send(updatedBody);
      } else {
        res.status(401).send("Unauthorized");
      }
    } catch (error) {
      next(error);
    }
  }
);
app.delete("/deleteProduct", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const productToDelete = req.body.productId;

      console.log(req.body);
      const filter = {
        _id: req.user.storeId,
      };
      const update = {
        $pull: { products: { _id: productToDelete } },
      };

      const result = await BusinessData.updateOne(filter, update);
      if (result.modifiedCount >= 1) {
        res.status(200).send("Success");
      } else {
        res.status(404).send("Product Not Found");
      }
    } else {
      res.status(401).send("Unauthroized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/get-store-id", async (req, res, next) => {
  try {
    const productId = req.body.productId;
    if (!productId) res.status(404).send("Product Id is Required");
    const findStore = await BusinessData.findOne({ "products._id": productId });
    res.status(200).send({
      storeId: findStore._id,
      soldBy: findStore.shopName,
      shopImage: findStore.shopImage,
      shopLogo: findStore.shopLogo,
    });
  } catch (error) {
    next(error);
  }
});
app.post("/get-store-name", async (req, res, next) => {
  try {
    const storeId = req.body.storeId;
    if (!storeId) res.status(404).send("Store Id is Required");
    const findStore = await BusinessData.findOne({ _id: storeId });
    res.status(200).send({
      storeId: findStore._id,
      soldBy: findStore.shopName,
      shopImage: findStore.shopImage,
      shopLogo: findStore.shopLogo,
      address : findStore.address,
      contactNumber : findStore.contactNumber,
      timings : findStore.timings
    });
  } catch (error) {
    next(error);
  }
});
app.post("/order", auth, async (req, res) => {
  try {
    if (req.token) {
      const user = req.user;
      const { storeId } = req.body;
      const store = await BusinessData.findOne({ _id: storeId });
    }
  } catch (error) {}
});
app.get("/dashboard/yourAccount", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const {
        city,
        state,
        contactNumber,
        shopName,
        ownerName,
        email,
        address,
        timings,
        shopCategory,
        shopImage,
      } = await BusinessData.findOne({ _id: req.user.storeId });
      res.status(200).send({
        city,
        state,
        contactNumber,
        shopName,
        ownerName,
        email,
        address,
        timings,
        shopCategory,
        shopImage,
      });
      if (!city) {
        res.status(404).send("Store Not Found");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/dashboard/yourAccount", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      if (req.body.of == "personalInfo") {
        const {
          ownerName,
          shopName,
          contactNumber,
          address,
          state,
          city,
        } = req.body;
        const merchant = await BusinessData.findByIdAndUpdate(
          { _id: req.user.storeId },
          {
            ownerName,
            shopName,
            contactNumber,
            address,
            state,
            city,
          }
        );
        res.status(200).send("Information Saved Succesfully");
      } else if (req.body.of == "timings") {
        const { Mon, Tue, Wed, Thu, Fri, Sat, Sun } = req.body;

        const merchant = await BusinessData.findByIdAndUpdate(
          { _id: req.user.storeId },
          {
            timings: {
              Mon,
              Tue,
              Wed,
              Thu,
              Fri,
              Sat,
              Sun,
            },
          }
        );
        res.status(200).send("Information Saved Succesfully");
      }
    } else {
      res.status(404).send("User not Found");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/get-products-category-list", auth, async (req, res, next) => {
  try {
    const { category } = req.body;
    let result = PRODUCTS_DATA[category] || [];

    if (category == "Footwear" || category == "Clothing")
      result = PRODUCTS_DATA[category]?.[req.body.gender] || [];

    if (result.length > 0 || result != "" || result != {}) {
      res.status(200).send(result);
    } else {
      res.status(404).send("Product Not Found");
    }
  } catch (error) {
    next(error);
  }
});

app.get("/onBoard/config", auth, async (req, res, next) => {
  try {
    if (req.token) {
      res.status(200).send(ONBOARD_FORM_CONFIG);
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/onBoarding", auth, upload.any(), async (req, res, next) => {
  try {
    if (req.token) {
      if (req.user.registeredForStore === "approved") {
        res.status(400).send("Your store is already approved");
      }
      if (req.user.registeredForStore === "pending") {
        res.status(400).send("We are still reviewing your store details.");
      } else {
        const uploadPromises = req.files.map(async (file) => {
          const uploadedUrl = await uploadOnCloudinary(file.path);
          file.uploadedUrl = uploadedUrl; // Save the URL to the file object
          return file; // Return the updated file object
        });

        const updatedFiles = await Promise.all(uploadPromises);
        req.files = updatedFiles;

        const formData = {};
        Object.keys(req.body).forEach((key) => {
          const keys = key.split(".");
          keys.reduce((acc, k, index) => {
            if (index === keys.length - 1) {
              acc[k] = req.body[key];
            } else {
              acc[k] = acc[k] || {};
            }
            return acc[k];
          }, formData);
        });
        req.files.forEach((file) => {
          const keys = file.fieldname.split(".");
          console.log(file);
          keys.reduce((acc, k, index) => {
            if (index === keys.length - 1) {
              acc[k] = file.uploadedUrl;
            } else {
              acc[k] = acc[k] || {};
            }
            return acc[k];
          }, formData);
        });

        const uploadStore = await admin.findOneAndUpdate(
          { UID },
          {
            $push: {
              stores: {
                _id: new ObjectId(),
                ...formData,
                status: "pending",
                email: req.user.email,
                userId: req.user._id.valueOf(),
              },
            },
          },
          { new: true }
        );
        if (uploadStore) {
          const updateUser = await UserData.findByIdAndUpdate(
            { _id: req.user.id },
            { registeredForStore: "pending" },
            { new: true }
          );
          if (updateUser) {
            res.status(200).send("Registration Successfull");
          } else {
            deleteFiles(files);
            throw new Error("Something went wrong");
          }
        } else {
          deleteFiles(files);
          throw new Error("Something went wrong");
        }
      }
    } else {
      res.status(404).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

app.get("/wishlist", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const ids = req.user.wishlist.map((id) =>
        ObjectId.createFromHexString(id)
      );
      console.log(ids);
      let idS = req.user.wishlist;
      if (ids.length === 0) {
        res.status(200).send([]);
      } else {
        const query = {
          "products._id": { $in: ids },
        };

        const cursor = await BusinessData.find(query).lean();
        console.log(cursor);
        const products = [];

        cursor.forEach((store) => {
          store.products.forEach((product) => {
            if (idS.includes(product._id)) {
              console.log(product);
              products.push({
                ...product,
                address: store.address,
                city: store.city,
                contactNumber: store.contactNumber,
                email: store.email,
                soldBy: store.shopName,
              });
            }
          });
        });

        res.status(200).send(products);
      }
    } else {
      req.status(401).send("Unauthorised");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/update-wishlist", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const { task, id } = req.body;

      if (task === "remove") {
        const wishlist = await UserData.findByIdAndUpdate(
          { _id: req.user._id },
          { $pull: { wishlist: id } },
          { new: true, useFindAndModify: false }
        );
        if (!wishlist) {
          return res.status(404).send("Product not found");
        } else {
          return res.status(200).send("Product removed from wishlist");
        }
      } else {
        const wishlist = await UserData.findByIdAndUpdate(
          { _id: req.user._id },
          { $addToSet: { wishlist: id } },
          { new: true, useFindAndModify: false }
        );
        if (!wishlist) {
          return res.status(404).send("Product not found");
        } else {
          return res.status(200).send("Product added to wishlist");
        }
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/generate-loyalty-code", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const amount = req.body.amount;
      console.log(req.body);
      if (typeof amount === "number") {
        if (amount >= 10) {
          const loyaltyCode = uid.rnd();
          const insertLoyalty = await BusinessData.updateOne(
            { _id: ObjectId.createFromHexString(req.user.storeId) },
            {
              $push: {
                loyalty: { code: loyaltyCode, amount },
                $setOnInsert: { loyalty: [] },
              },
            }
          );
          if (insertLoyalty.modifiedCount >= 1) {
            res.status(200).send({ code: loyaltyCode });
          } else {
            res.status(400).send("Failed to generate code");
          }
        } else {
          res.status(500).send("Amount must be a greater than 10");
        }
      } else {
        res.status(400).send("Amount must be a valid amount");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/validate-loyalty-code", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const code = req.body.code;
      const loyaltyData = await BusinessData.findOne({ _id: req.user.storeId });

      if (loyaltyData) {
        const filterLoyalty = loyaltyData.loyalty.filter(
          (loyalty) => loyalty.code === code
        );
        if (filterLoyalty.length > 0) {
          res.status(200).send(filterLoyalty[0]);
        } else {
          res
            .status(404)
            .send("Loyalty code does not exist or is already redeemed");
        }
      } else {
        res
          .status(404)
          .send("Loyalty code does not exist or is already redeemed");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/redeem-loyalty-code", auth, async (req, res, next) => {
  try {
    if (req.token && req.user.role === "merchant" && req.user.storeId) {
      const code = req.body.code;

      const loyaltyData = await BusinessData.findOne({ _id: req.user.storeId });

      if (loyaltyData) {
        const filterLoyalty = loyaltyData.loyalty.filter(
          (loyalty) => loyalty.code === code
        );
        if (filterLoyalty.length > 0) {
          const redeemCode = await BusinessData.findOneAndUpdate(
            { _id: req.user.storeId },
            { $pull: { loyalty: { code: code } } },
            { new: true }
          );
          if (redeemCode) {
            res
              .status(200)
              .send(
                `Gift Card of Rs ${filterLoyalty[0].amount} has been successfully redeemed`
              );
          } else {
            res.status(500).send("Failed to redeem code");
          }
        } else {
          res.status(404).send("Code does not exist or is already redeemed");
        }
      } else {
        res.status(404).send("Code does not exist or is already redeemed");
      }

      // console.log(loyaltyData)
      // if(loyaltyData.length > 0){
      //   const filterLoyalty = loyaltyData[0].loyalty.filter(loyalty => loyalty.code === code)
      //   res.status(200).send(filterLoyalty[0])
      // }else{
      //   res.status(404).send("Loyalty code does not exist or is already redeemed")
      // }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

///////ORDER & PAYMENT------------------------------------------------------------------------------------------

app.post("/create-order", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const products = req.body.products
      const variantIds = Object.values(products).map(item => ObjectId.createFromHexString(item.variantId));;
      let totalAmount = 0;
      let tax = 0;
      const ids = Object.values(products).map((p) =>
        ObjectId.createFromHexString(p.productId)
      );
      const idsC = Object.values(products).map((p) => p.productId);
      // Fetch documents containing the products
      const documents = await BusinessData.find({
        "products._id": { $in: ids },
      }).lean();
      // Extract matched products
      let filteredProducts;
      let matchedProducts = [];
      documents.forEach((doc) => {
        filteredProducts = doc.products.filter((prod) =>
          idsC.includes(String(prod._id))
        );
      });
      Object.values(products).forEach((prod) => {
        for (const product of filteredProducts) {
          if (String(product._id) === prod.productId) {
            for(const variant of product.variants){
                if(String(variant._id) === prod.variantId){
                  totalAmount += variant.sellingPrice * prod.quantity;
                  tax += ((variant.sellingPrice * prod.quantity) * product["GST rate slab"]) / 100
                  break;
                }
            }
            break;
          }
        }
      });
      const amount = parseFloat((totalAmount + tax)).toFixed(2);
      const options = {
        amount: Number(amount * 100),
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),
      };

      razorpayInstance.orders.create(options, (error, order) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Something Went Wrong!" });
        }
        res.status(200).json({ data: order });
      });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

app.post("/update-order-status", auth, async (req, res, next) => {
  try {
    if (req.token) {
      if (req.user.role === "merchant") {
        const { status, orderId } = req.body;
        const validStatuses = [
          "Awaiting Confirmation",
          "Ready for Pickup",
          "Collected",
        ];
        if (!validStatuses.includes(status)) {
          return res.status(400).send("Invalid order status");
        }
        const result = await BookingsData.findOneAndUpdate(
          { orderId },
          { orderStatus: status },
          { new: true } // Return the updated document
        );

        if (!result) {
          res.status(404).send("Order not Found");
        } else {
          res.status(200).send("Success");
        }
      } else {
        res.status(401).send("Unauthorized");
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {}
});

app.post("/get-orders", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const { pageParam = 0 } = req.query;
      const bookings = await BookingsData.find({
        orderId: { $in: req.user.bookings },
      })
        .skip(pageParam - 1)
        .limit(PAGINATION_LIMIT);
      res.send(bookings);
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/get-merchant-orders", auth, async (req, res, next) => {
  try {
    if (req.token) {
      const { pageParam = 1 } = req.query;
      const findStore = await BusinessData.findById(req.user.storeId);
      if (findStore.bookings.length < 1) {
        return res.status(200).send([]);
      }
      const bookings = await BookingsData.find({
        orderId: { $in: findStore.bookings },
      })
        .sort({ bookingDateTime: -1 })
        .skip(pageParam - 1)
        .limit(20);
      res.send(bookings);
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/cop-order" , auth , async(req,res,next) => {
  try{
    if(req.token){
      const products = req.body.products
      const variantIds = Object.values(products).map(item => ObjectId.createFromHexString(item.variantId));;
      let totalAmount = 0;
      let tax = 0;
      const ids = Object.values(products).map((p) =>
        ObjectId.createFromHexString(p.productId)
      );
      const idsC = Object.values(products).map((p) => p.productId);
      // Fetch documents containing the products
      const documents = await BusinessData.find({
        "products._id": { $in: ids },
      }).lean();
      // Extract matched products
      let filteredProducts;
      let matchedProducts = [];
      documents.forEach((doc) => {
        filteredProducts = doc.products.filter((prod) =>
          idsC.includes(String(prod._id))
        );
      });
      Object.values(products).forEach((prod) => {
        for (const product of filteredProducts) {
          if (String(product._id) === prod.productId) {
            for(const variant of product.variants){
                if(String(variant._id) === prod.variantId){
                  totalAmount += variant.sellingPrice * prod.quantity;
                  tax += ((variant.sellingPrice * prod.quantity) * product["GST rate slab"]) / 100
                  break;
                }
            }
            break;
          }
        }
      });
      const amount = parseFloat((totalAmount + tax)).toFixed(2);

      const productDetails = Object.values(products).map((p) => p);
      const userDetails = req.user;
      const storeDetails = await BusinessData.findOne({
        "products._id": productDetails[0].productId,
      }).lean();
      const session = await mongoose.startSession();
      session.startTransaction();
      console.log(productDetails)
      const bookingData = {
        userId: userDetails.id,
        userName: userDetails.name,
        userEmail: userDetails.email,
        storeId: String(storeDetails._id),
        storeName: storeDetails.shopName,
        storeImage: storeDetails.shopImage,
        address: storeDetails.address,
        contact: storeDetails.contactNumber,
        bookingDateTime: new Date().toISOString(),
        orderId: generateOrderId(),
        orderStatus: "Awaiting Confirmation",
        amount,
        amountPaid: 0,
        paymentStatus: "Pending",
        paymentMode : "Cash On Point",
        products: productDetails.map((p) => ({
          productId: p.productId,
          variant : {...p.variant},
          price: p.price,
          SGST : (((p.price * p.quantity) * (p.tax / 2)) / 100).toFixed(2),
          CGST : (((p.price * p.quantity) * (p.tax / 2)) / 100).toFixed(2),
          tax : p.tax,
          totalTax : (((p.price * p.quantity) * p.tax) / 100).toFixed(2),
          grandTotal : ((p.price * p.quantity) + (((p.price * p.quantity) * p.tax) / 100)).toFixed(2),
          name: p.productName,
          image: p.image,
          quantity: p.quantity,
        })),
      };
      const newBooking = new BookingsData(bookingData);
      const savedBooking = await newBooking.save({ session });

      await UserData.findByIdAndUpdate(
        { _id: userDetails.id },
        { $push: { bookings: savedBooking.orderId } },
        { new: true, session }
      );
      await BusinessData.findOneAndUpdate(
        { _id: String(storeDetails._id) },
        { $push: { bookings: savedBooking.orderId } },
        { new: true, session }
      );

      await session.commitTransaction();
      session.endSession();
      res.json({
        message: "Order Successfull",
      });

    }    
  }catch(error){
 console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Internal Server Error!" });
  }
})
app.post("/verify-payment", auth, async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      products,
    } = req.body;

    const productDetails = Object.values(products).map((p) => p);
    const userDetails = req.user;
    const orderId = razorpay_order_id;
    const orderDetails = await razorpayInstance.orders.fetch(orderId);
    const paymentDetails = await razorpayInstance.orders.fetchPayments(orderId);
    const storeDetails = await BusinessData.findOne({
      "products._id": productDetails[0].productId,
    }).lean();
    console.log(productDetails);
    // Create Sign
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    // Create ExpectedSign
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET_PROD)
      .update(sign.toString())
      .digest("hex");

    // console.log(razorpay_signature === expectedSign);

    // Create isAuthentic
    const isAuthentic = expectedSign === razorpay_signature;

    // Condition
    if (isAuthentic) {
      const session = await mongoose.startSession();
      session.startTransaction();
      const bookingData = {
        userId: userDetails.id,
        userName: userDetails.name,
        userEmail: userDetails.email,
        storeId: String(storeDetails._id),
        storeName: storeDetails.shopName,
        storeImage: storeDetails.shopImage,
        address: storeDetails.address,
        contact: storeDetails.contactNumber,
        bookingDateTime: new Date().toISOString(),
        orderId: orderId,
        orderStatus: "Awaiting Confirmation",
        amount: formatPrice(orderDetails.amount / 100),
        amountPaid: formatPrice(orderDetails.amount_paid / 100),
        paymentMode : "Prepaid",
        paymentStatus: "Completed",
        products: productDetails.map((p) => ({
          productId: p.productId,
          variant : {...p.variant},
          price: p.price,
          SGST : (((p.price * p.quantity) * (p.tax / 2)) / 100).toFixed(2),
          CGST : (((p.price * p.quantity) * (p.tax / 2)) / 100).toFixed(2),
          tax : p.tax,
          totalTax : (((p.price * p.quantity) * p.tax) / 100).toFixed(2),
          grandTotal : ((p.price * p.quantity) + (((p.price * p.quantity) * p.tax) / 100)).toFixed(2),
          name: p.productName,
          image: p.image,
          quantity: p.quantity,
        })),
      };
      const newBooking = new BookingsData(bookingData);
      const savedBooking = await newBooking.save({ session });

      await UserData.findByIdAndUpdate(
        { _id: userDetails.id },
        { $push: { bookings: savedBooking.orderId } },
        { new: true, session }
      );
      await BusinessData.findOneAndUpdate(
        { _id: String(storeDetails._id) },
        { $push: { bookings: savedBooking.orderId } },
        { new: true, session }
      );
      const payment = new PaymentData({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      // Save Payment
      await payment.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Send Message
      res.json({
        message: "Payment Successfull",
      });
    } else {
      res.json({
        message: "Payment Failed",
      });
    }
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

///////ORDER & PAYMENT------------------------------------------------------------------------------------------

////// ADMIN ROUTES -----------------------------------------------

app.get("/adminAuth", adminAuth, async (req, res, next) => {
  try {
    if (req.token) {
      const { UID, stores } = req.admin;
      res.status(200).send({
        UID,
        stores,
      });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/admin/login", async (req, res, next) => {
  try {
    const { UID, password } = req.body;
    const getAdmin = await admin.findOne({ UID });
    if (getAdmin) {
      const passMatch = await bcrypt.compare(password, getAdmin.password);
      if (passMatch) {
        const token = await getAdmin.generateToken();
        res.cookie("admin", token, {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        });
        res.status(200).send("Login Successfull");
      } else {
        res.status(401).send("Invalid Credentials");
      }
    } else {
      res.status(404).send("Admin does not Exist");
    }
  } catch (error) {
    next(error);
  }
});

app.post("/test-update-config", async (req, res) => {
  try {
    const data = {
      settlements: {
        account_number: "1234567890",
        ifsc_code: "HDFC0000317",
        beneficiary_name: "Gaurav Kumar",
      },
      tnc_accepted: true,
    };

    const response = await axios.patch(
      "https://api.razorpay.com/v2/accounts/acc_ObKcc9axhiLu6a/products/acc_prd_ObKeOjoMrq9ELC/",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    res.send(error);
  }
});
app.post("/test-config", async (req, res) => {
  try {
    const data = {
      product_name: "route",
      tnc_accepted: true,
    };

    const response = await axios.post(
      "https://api.razorpay.com/v2/accounts/acc_ObKcc9axhiLu6a/products",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    res.send(error);
  }
});
app.post("/test-stakeholder", async (req, res) => {
  try {
    const data = {
      name: "Gaurav Kumar",
      email: "gaurav.kumar234@example.com",
    };
    const response = await axios.post(
      "https://api.razorpay.com/v2/accounts/acc_ObKcc9axhiLu6a/stakeholders",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    res.send(error);
  }
});

async function updateConfig(data, accountId, productId) {
  const response = await axios.patch(
    `https://api.razorpay.com/v2/accounts/${accountId}/products/${productId}/`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
      },
    }
  );
  return response.data;
}

async function createConfig(data, accountId) {
  const response = await axios.post(
    `https://api.razorpay.com/v2/accounts/${accountId}/products`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
      },
    }
  );
  return response.data;
}

async function createStakeholder(data, accountId) {
  const response = await axios.post(
    `https://api.razorpay.com/v2/accounts/${accountId}/stakeholders`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
      },
    }
  );
  return response.data;
}

async function createVendorId(data) {
  const response = await axios.post(
    "https://api.razorpay.com/v2/accounts",
    data,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
      },
    }
  );
  return response.data;
}

app.post("/test-vendor-func", async (req, res) => {
  try {
    const dummyData = {
      email: "test.user212@example.com",
      phone: "9999999999",
      type: "route",
      reference_id: "test123322",
      legal_business_name: "Test Corp 22",
      business_type: "other",
      contact_name: "John Doe",
      profile: {
        category: "ecommerce",
        subcategory: "fashion_and_lifestyle",
        addresses: {
          registered: {
            street1: "123 Test Street",
            street2: "Suite 456",
            city: "Mumbai",
            state: "MAHARASHTRA",
            postal_code: "400001",
            country: "IN",
          },
        },
      },
    };

    const stakeholderdata = {
      name: "Gaurav Kumar",
      email: "gaurav.kumar23224@example.com",
    };
    const configdata = {
      product_name: "route",
      tnc_accepted: true,
    };
    const updateconfigdata = {
      settlements: {
        account_number: "1234569870",
        ifsc_code: "HDFC0000372",
        beneficiary_name: "Gaurav",
      },
      tnc_accepted: true,
    };

    const createVendor = await createVendorId(dummyData);
    const accountId = createVendor.id;

    const stakeholder = await createStakeholder(stakeholderdata, accountId);

    const config = await createConfig(configdata, accountId);
    const productId = config.id;
    console.log(productId);
    const updatedConfig = await updateConfig(
      updateconfigdata,
      accountId,
      productId
    );

    res.send(updatedConfig);
  } catch (error) {
    res.send(error);
  }
});

app.post("/test-vendor", async (req, res) => {
  try {
    const data = {
      email: "gauravvv.kumar@example.com",
      phone: "9000090000",
      type: "route",
      reference_id: "1241241",
      legal_business_name: "Acme Corp",
      business_type: "other",
      contact_name: "Gaurav Kumar A",
      profile: {
        category: "ecommerce",
        subcategory: "fashion_and_lifestyle",
        addresses: {
          registered: {
            street1: "507, Koramangala 1st block",
            street2: "MG Road",
            city: "Bengaluru",
            state: "KARNATAKA",
            postal_code: "560034",
            country: "IN",
          },
        },
      },
      legal_info: {
        pan: "AAACL1234A",
        gst: "18AABCU9603R1ZP",
      },
    };

    const response = await axios.post(
      "https://api.razorpay.com/v2/accounts",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${RZ_CREDENTIALS}`, // Correct format for Basic Auth
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    res.send(error);
  }
});
app.post("/admin/approve-store", adminAuth, async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.token) {
      let storeId = req.body.storeId;
      if (!storeId) {
        res.status(400).send("Please provide store Id");
      } else {
        storeId = ObjectId.createFromHexString(storeId);

        const approvedStore = await admin.findOneAndUpdate(
          { _id: req.admin.id },
          { $set: { "stores.$[elem].status": "approved" } },
          { arrayFilters: [{ "elem._id": storeId }], new: true, session }
        );
        if (approvedStore) {
          const {
            _id,
            ownerName,
            shopName,
            shopImage,
            contactNumber,
            email,
            address,
            state,
            city,
            shopCategory,
            shopLogo,
            PANcard,
            bankaccount,
            aadhaarcard,
            gst,
            latitude,
            longitude,
            userId,
          } = approvedStore.stores.find((elem) => elem._id.equals(storeId));
          console.log(ownerName)
          const data = {
            email: email,
            phone: contactNumber,
            type: "route",
            reference_id: String(_id).slice(-10),
            legal_business_name: shopName,
            business_type: "other",
            contact_name: ownerName,
            profile: {
              category: "ecommerce",
              subcategory: "fashion_and_lifestyle",
              addresses: {
                registered: {
                  street1: address,
                  street2: address,
                  city: city,
                  state: state,
                  postal_code: "440012",
                  country: "IN",
                },
              },
            },
          };

          const stakeholderdata = {
            name: ownerName,
            email: email,
          };
          const configdata = {
            product_name: "route",
            tnc_accepted: true,
          };
          const updateconfigdata = {
            settlements: {
              account_number: bankaccount.number,
              ifsc_code: bankaccount.ifsc,
              beneficiary_name: ownerName,
            },
            tnc_accepted: true,
          };

          const createVendor = await createVendorId(data);
          const accountId = createVendor.id;

          const stakeholder = await createStakeholder(
            stakeholderdata,
            accountId
          );

          const config = await createConfig(configdata, accountId);
          const productId = config.id;
          console.log(productId);
          const updatedConfig = await updateConfig(
            updateconfigdata,
            accountId,
            productId
          );
          console.log(updatedConfig);
          const newStore = await new BusinessData({
            RZPaccountId: accountId,
            RZPproductId: productId,
            ownerName,
            shopName,
            shopImage,
            contactNumber,
            email,
            address,
            state,
            city,
            shopCategory,
            shopLogo,
            PANcard,
            bankaccount,
            aadhaarcard,
            gst,
            location: {
              type: "Point",
              coordinates: [latitude, longitude],
            },
          }).save({ session });

          const updateUser = await UserData.updateOne(
            { _id: userId },
            {
              $set: {
                registeredForStore: "approved",
                role: "merchant",
                storeId: newStore._id,
              },
            },
            { session }
          );

          if (updateUser.modifiedCount === 1) {
            await session.commitTransaction();
            session.endSession();

            transporter
              .sendMail({
                from: "Zooptick <zooptickofficial@gmail.com>",
                to: email,
                subject: "Store Approved",
                html: `<div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
        <h2 style="text-align: center; color: #4CAF50;">Congratulations</h2>
        <h1 style="text-align: center;">Welcome to Zooptick</h1>
        <div style="border-top: 1px solid #ccc;margin-top : 1rem; padding-top: 10px; text-align: left;">
           <p>Your request has been approved and you can go live now . To add products, Click the link below</p>
           <a href="https://www.zooptick.com/dashboard/products">Add products</a>
        </div>
        <p style="text-align: left;margin-top: 2rem; font-size: 1.2em;">
            Best Wishes,
            <br>
            <strong>Team Zooptick</strong>
        </p>
         <div style="text-align: center; margin-top: 50px;">
            <img src="https://www.zooptick.com/assets/zooptickWhite-CxScf5Y4.svg" alt="Zooptick Image" width="250" height="50" style="display: inline-block;">
        </div>
         
    </div>`,
              })
              .then(() => {
                res.status(200).send("Approved Successfully");
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            await session.abortTransaction();
            session.endSession();
            res.status(500).send("Something went wrong");
          }
        } else {
          await session.abortTransaction();
          session.endSession();
          res.status(500).send("Store approval failed");
        }
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.log(error)
    console.log(error?.response?.data?.error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});
app.post("/admin/reject-store", adminAuth, async (req, res, next) => {
  try {
    if (req.token) {
      let storeId = req.body.storeId;
      const reason = req.body.reason;
      const generateReasonHtml = `<ol>
      ${reason
        .split(",")
        .map((item) => `<li>${item}</li>`)
        .join("")}
      </ol>`;
      if (!storeId) {
        res.status(400).send("Store Id is required");
      } else {
        storeId = ObjectId.createFromHexString(storeId);
        const rejectedStore = await admin.findOneAndUpdate(
          { _id: req.admin.id },
          { $set: { "stores.$[elem].status": "rejected" } },
          { arrayFilters: [{ "elem._id": storeId }], new: true }
        );
        if (rejectedStore) {
          const { userId, email } = rejectedStore.stores.find((elem) =>
            elem._id.equals(storeId)
          );
          const updateUser = await UserData.updateOne(
            { _id: userId },
            {
              $set: {
                registeredForStore: "rejected",
              },
            }
          );
          if (updateUser.modifiedCount === 1) {
            transporter
              .sendMail({
                from: "Zooptick <zooptickofficial@gmail.com>",
                to: email,
                subject: "Store Rejected",
                html: `   <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
        <p style="font-size : 1rem;color : #a885e8">Hello,</p>
        <p style="margin-top : 1rem;">We carefully reviewed and validated the information you provided, and we discovered the following errors:</p>
                ${generateReasonHtml}
        <p>Feel free, and kindly check the incorrect information and send it to us amended.</p>
        <p style="margin-top : 1rem;">Warm Regards,<br><strong style="color : #a885e8">ZOOPTICK</strong></p>
    </div>
`,
              })
              .then(() => {
                res.status(200).send("Store Rejected");
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            res.status(500).send("Something went wrong");
          }
        }
      }
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});

////// ADMIN ROUTESS -----------------------------------------------

app.get("/location", async (req, res, next) => {
  try {
    const { lat, long } = req.query;
    console.log(lat, long);
    const {
      data: { results: results },
    } = await axios.get(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${long}&api_key=QZQMlxb9q6t1AefOegtt4Ck8d4oTi3kUf5X34TPE`
    );
    console.log(results);
    const addressComponents = results[1].address_components;
    const formateddAddress = results[1].formatted_address;

    const getAddressStringAndLocality = (components) => {
      const types = ["neighborhood", "sublocality", "locality"];
      const shortNames = types.map((type) => {
        const component = components.find((component) =>
          component.types.includes(type)
        );
        return component ? component.short_name : "";
      });

      const combinedString = shortNames.filter((name) => name).join(", ");

      const localityComponent = components.find((component) =>
        component.types.includes("locality")
      );
      const locality = localityComponent ? localityComponent.short_name : "";

      return { combinedString, locality };
    };

    const { combinedString, locality } = getAddressStringAndLocality(
      addressComponents
    );
    res.status(200).send({
      address: formateddAddress,
      city: locality,
      street: combinedString,
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  // Send the error response
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Include the stack trace if in development environment
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

const server = require("http").createServer(app);
server.listen(port, () => {
  console.log("Conection is established at " + port);
});

function formatToLocalTime(isoString) {
  const date = new Date(isoString);
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // Indian Standard Time (IST)
  };

  const formatter = new Intl.DateTimeFormat("en-IN", options);
  const parts = formatter.formatToParts(date);

  // Manually format the parts to the desired string format
  const day = parts.find((p) => p.type === "day").value;
  const month = parts.find((p) => p.type === "month").value;
  const year = parts.find((p) => p.type === "year").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;
  const period = parts.find((p) => p.type === "dayPeriod").value; // AM/PM

  return `${day}/${month}/${year} - ${hour}:${minute} ${period}`;
}
