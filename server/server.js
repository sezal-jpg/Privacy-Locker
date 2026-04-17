require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "jwtsecret";

app.use(cors());
app.use(express.json());

// ================== CLOUDINARY ==================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================== TEMP STORAGE ==================
let users = [];
let files = [];

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

  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });

  res.json({ message: "Signup successful" });
});

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ email }, JWT_SECRET);
  res.json({ token });
});

// ================== UPLOAD ==================
app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const user = users.find((u) => u.email === req.user);

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

    files.push({
      user: req.user,
      public_id: result.public_id,
      url: result.secure_url, // 🔥 IMPORTANT
      originalName: req.file.originalname,
    });

    res.json({ message: "File uploaded successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ================== FILE LIST ==================
app.get("/files", authMiddleware, (req, res) => {
  const userFiles = files.filter((f) => f.user === req.user);
  res.json(userFiles);
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

    files = files.filter(
      (f) => !(f.public_id === id && f.user === req.user)
    );

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});