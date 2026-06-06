require("dotenv").config();
const User = require("./models/User");
const File = require("./models/File");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const {
  OAuth2Client,
} = require("google-auth-library");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "jwtsecret";
const client =
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );
app.use(cors());
app.use(express.json());
console.log("URI =", process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });
// ================== CLOUDINARY ==================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================== AUTH ==================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.email;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================== MULTER ==================
const upload = multer({ storage: multer.memoryStorage() });

// ================== SIGNUP ==================
app.post("/signup", async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });


 const existingUser = await User.findOne({
  email,
});

if (existingUser)
  return res.status(400).json({
    message: "User already exists",
  });
    return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
  email,
  password: hashed,
});

  res.json({ message: "Signup successful" });
});
// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  console.log("LOGIN ROUTE VERSION 777");

  let { email, password } = req.body;

  console.log("EMAIL RECEIVED:", email);
  console.log("PASSWORD RECEIVED:", password);
  console.log("USERS ARRAY:", users);

  email = email?.trim();
  password = password?.trim();

const user = await User.findOne({
  email,
});

  console.log("FOUND USER:", user);

  if (!user) {
    console.log("USER NOT FOUND");
    return res.status(400).json({
      message: "User not found",
    });
  }

  const match = await bcrypt.compare(
    password,
    user.password
  );

  console.log("PASSWORD MATCH:", match);

  if (!match) {
    console.log("INVALID PASSWORD");
    return res.status(400).json({
      message: "Invalid password",
    });
  }

  const token = jwt.sign(
    { email },
    JWT_SECRET
  );

  console.log("TOKEN GENERATED");

  res.json({ token });
});
// ================== GOOGLE LOGIN ==================
app.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({
  email,
});

    if (!user) {
      const hashed = await bcrypt.hash(
        Math.random().toString(),
        10
      );

      user = await User.create({
  email,
  password: hashed,
});
    }

    const token = jwt.sign(
      { email },
      JWT_SECRET
    );

    res.json({ token });

  } catch (err) {
    console.error(err);

    res.status(401).json({
      message: "Invalid Google login",
    });
  }
});

// ================== UPLOAD ==================
app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const user = await User.findOne({
  email: req.user,
});

    const encrypted = CryptoJS.AES.encrypt(
      req.file.buffer.toString("base64"),
      user.password
    ).toString();

    const result = await cloudinary.uploader.upload(
      "data:text/plain;base64," + Buffer.from(encrypted).toString("base64"),
      {
        folder: "privacy-locker",
        resource_type: "raw",
      }
    );

    await File.create({
  user: req.user,
  public_id: result.public_id,
  url: result.secure_url,
  originalName:
    req.file.originalname,
});

    res.json({ message: "File uploaded successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ================== FILE LIST ==================
app.get("/files", authMiddleware, async (req, res) => {
  try {
    const userFiles = await File.find({
      user: req.user,
    });

    res.json(userFiles);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch files",
    });
  }
});

// ================== DELETE ==================
app.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const id = req.query.id;

    let result = await cloudinary.uploader.destroy(id, {
      resource_type: "raw",
    });

    if (result.result === "not found") {
      result = await cloudinary.uploader.destroy(id, {
        resource_type: "image",
      });
    }

    await File.deleteOne({
  public_id: id,
  user: req.user,
});

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});