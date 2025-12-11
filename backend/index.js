const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

// CLOUDINARY CONFIG
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// APP MIDDLEWARE
app.use(express.json());
app.use(cors());

// MONGO DB CONNECT
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Express App is Running");
});

// MULTER — MEMORY STORAGE (IMPORTANT FOR RENDER)
const upload = multer({ storage: multer.memoryStorage() });

// CLOUDINARY UPLOAD ROUTE
app.post("/upload", upload.single("product"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("❌ No file received from client");
      return res.status(400).json({ success: 0, error: "No file uploaded" });
    }

    console.log("📦 File received, uploading to Cloudinary...");

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "shopnow_products" },
      (error, result) => {
        if (error) {
          console.error("🔥 CLOUDINARY ERROR:", error);
          return res.status(500).json({ success: 0, error: error.message });
        }

        console.log("✅ Upload SUCCESS → URL:", result.secure_url);

        return res.json({
          success: 1,
          image_url: result.secure_url,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    res.status(500).json({ success: 0, error: error.message });
  }
});


// PRODUCT MODEL
const Product = mongoose.model("Product", {
  id: Number,
  name: String,
  image: String,
  category: String,
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// ADD PRODUCT
app.post("/addproduct", async (req, res) => {
  try {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
      id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });

    await product.save();
    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// REMOVE PRODUCT
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true });
});

// GET ALL PRODUCTS
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  res.send(products);
});

// GET Popular in women 
app.get('/popularinwomen', async(req, res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(2, 4);
    console.log("Popular in women fetched");
    res.send(popular_in_women);
});

// GET NEW Collections 
app.get('/newcollections', async(req, res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
});


// USER MODEL
const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now },
});

// SIGNUP
app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, error: "User Exists" });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) cart[i] = 0;

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
  res.json({ success: true, token });
});

// LOGIN
app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });

  if (!user) {
    return res.json({ success: false, errors: "Wrong Email" });
  }

  if (req.body.password !== user.password) {
    return res.json({ success: false, errors: "Wrong Password" });
  }

  const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
  res.json({ success: true, token });
});

// AUTH MIDDLEWARE
const fetchUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).send({ errors: "Not authenticated" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch {
    return res.status(401).send({ errors: "Invalid token" });
  }
};

// ADD TO CART
app.post("/addtocart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.updateOne({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// REMOVE FROM CART
app.post("/removefromcart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;

  await Users.updateOne({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// GET CART
app.post("/getcart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// START SERVER
app.listen(port, () => {
  console.log("Server running on port " + port);
});
