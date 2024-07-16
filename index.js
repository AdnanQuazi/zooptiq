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
const { ObjectId } = mongoose.Types;
const port = process.env.PORT || 3000;
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://192.168.1.39:5173",
    "https://zooptiq.vercel.app",
  ],
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
};
const { uploadOnCloudinary } = require('./cloudinary.js');





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
      name: "onGoogleMaps",
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
        label: "PAN number",
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
        label: "PAN image",
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
        label: "Aadhaar number",
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
        label: "Aadhaar card image",
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
        required: true,
        schema: {
          dataType: {
            condition: "string",
            error: "It must only contain letters",
          },
          required: { condition: true, error: "GST number is required" },
        },
      },
      {
        name: "gst.image",
        label: "GST certificate image",
        type: "file",
        accept: "image/*",
        required: true,
        schema: {
          dataType: {
            condition: "mixed",
          },
          required: {
            condition: true,
            error: "GST certiificate image is required",
          },
        },
      },
    ],
    "BANK ACCOUNT DETAILS": [
      {
        name: "bankaccount.number",
        label: "Bank account number",
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
        label: "IFSC code",
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
        label: "Bank account type",
        type: "select",
        options: ["Savings", "Current"],
        required: true,
        schema: {
          required: { condition: true, error: "Please select account type" },
        },
      },
      {
        name: "bankaccount.image",
        label: "Passbook image",
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
    user: "quaziadnan12352@gmail.com",
    pass: "fijw nwwc twis dtcx",
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp") // Destination folder for file uploads
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
      sameSite: "none",
      secure: true,
    });
    await newOtp.save();
    transporter
      .sendMail({
        from: "Noxsh <quaziadnan12352@gmail.com>",
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
            sameSite: "none",
            secure: true,
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
          sameSite: "none",
          secure: true,
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
          wishlist : req.user.wishlist || []
      });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    next(error);
  }
});
app.post("/logout", (req, res) => {
  res.clearCookie("jwt", {
    sameSite: "none",
    secure: true,
  });
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
    } = req.query;
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
      keys: [{ name: "productName", weight: 2 }, "subCategory"],
    };

    let productsData = [];

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
            });
          });
          // productsData = [...productsData , ...collections[i].products];
        }
      }
    } else {
      productsData = CACHED_PRODUCTS_DATA;
    }
    console.log(productsData);
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
    if (rating === "true") {
      finalResult.sort(
        (a, b) => b.reviews.averageRating - a.reviews.averageRating
      );
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
app.post(
  "/addProduct",
  auth,
  upload.array("images", 11),
  async (req, res, next) => {
    try {
      if (req.token && req.user.role === "merchant" && req.user.storeId) {
        function toCapitalizedWords(str) {
          return str
            .trim() // Remove extra spaces at the beginning and end
            .split(" ") // Split the string into words
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ) // Capitalize the first letter of each word
            .join(" "); // Join the words back into a single string with spaces
        }

        const body = req.body;
        const files = req.files.map(file => uploadOnCloudinary(file.path));;
        const uploadedUrls = await Promise.all(files);
        const parsedData = {};

        for (let key in body) {
          parsedData[key] = JSON.parse(body[key]);
        }
        parsedData.colors = parsedData.colors.map((elem) =>
          toCapitalizedWords(elem)
        );

        const product = await BusinessData.updateOne(
          { _id: req.user.storeId },
          { $push: { products: { ...parsedData, images: uploadedUrls } } }
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
  }
);
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
      { "products.$": 1 }
    );

    if (!result || result.products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(result.products[0]);
  } catch (error) {
    next(error);
  }
});
app.put(
  "/editProduct",
  auth,
  upload.array("images", 11),
  async (req, res, next) => {
    try {
      if (req.token && req.user.role === "merchant" && req.user.storeId) {
        const body = req.body;
        const parsedData = {};

        for (let key in body) {
          parsedData[key] = JSON.parse(body[key]);
        }
        console.log(req.files)
        const files = req.files.map(file => uploadOnCloudinary(file.path));
        const uploadedUrls = await Promise.all(files);

        const newFiles = [
          ...parsedData.prevImages,
          ...uploadedUrls,
        ];
        const filter = parsedData._id;
        const update = {};

        for (const [key, value] of Object.entries(parsedData)) {
          if (key === "statusAdmin" || key === "prevImages") continue;
          if (key === "images") {
            update[`products.$[elem].${key}`] = newFiles;
            continue;
          }
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
        const files = req.files.map(file => uploadOnCloudinary(file.path));;
        const uploadedUrls = await Promise.all(files);
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
              acc[k] = uploadedUrls[index];
            } else {
              acc[k] = acc[k] || {};
            }
            return acc[k];
          }, formData);
        });
        console.log(formData);
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
      console.log(ids)
      let idS = req.user.wishlist;
      if (ids.length === 0) {
        res.status(200).send([]);
      } else {
        const query = {
          "products._id": { $in: ids },
        };

        const cursor = await BusinessData.find(query).lean();
        console.log(cursor)
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

////// ADMIN ROUTES -----------------------------------------------

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
          sameSite: "none",
          secure: true,
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

app.post("/admin/approve-store", adminAuth, async (req, res, next) => {
  try {
    if (req.token) {
      let storeId = req.body.storeId;
      if (!storeId) {
        res.status(400).send("Please provide store Id");
      } else {
        storeId = ObjectId.createFromHexString(req.body.storeId);
        const approvedStore = await admin.findOneAndUpdate(
          { _id: req.admin.id },
          { $set: { "stores.$[elem].status": "approved" } },
          { arrayFilters: [{ "elem._id": storeId }], new: true }
        );
        if (approvedStore) {
          const {
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

          const insertStore = await new BusinessData({
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
          });
          const newStore = await insertStore.save();
          const updateUser = await UserData.updateOne(
            { _id: userId },
            {
              $set: {
                registeredForStore: "approved",
                role: "merchant",
                storeId: newStore._id,
              },
            }
          );

          if (updateUser.modifiedCount === 1) {
            res.status(200).send("Approved Successfully");
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
app.post("/admin/reject-store", adminAuth, async (req, res, next) => {
  try {
    if (req.token) {
      let storeId = req.body.storeId;
      const reason = req.body.reason;

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
                from: "Noxsh <quaziadnan12352@gmail.com>",
                to: email,
                subject: "Store Rejected",
                html: `<p>Your store has been rejected due to the follwoing reason(s) - </p> </br> <h2>${reason}</h2>`,
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
    const location = await axios.get(
      `https://us1.locationiq.com/v1/reverse?key=pk.63217c2db0adf79a36deb0a4b75785f7&lat=${lat}&lon=${long}&format=json`
    );
    console.log(location.data);
    res.status(200).send({
      neighbourhood: location.data.address.neighbourhood,
      city: location.data.address.city,
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
