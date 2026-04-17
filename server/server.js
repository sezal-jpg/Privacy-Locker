require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const fetch = require("node-fetch"); // ✅ required

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = "jwtsecret";

app.use(cors());
app.use(express.json());

// ================== CLOUDINARY CONFIG ==================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================== USER STORAGE ==================
let users = [];
let files = [];

// ================== AUTH ==================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token provided" });

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

// ================== AUTH ROUTES ==================

// SIGNUP
app.post("/signup", async (req, res) => {
  let { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  email = email.trim();
  password = password.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });

  res.json({ message: "User registered successfully" });
});

// LOGIN
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim();
  password = password?.trim();

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ email }, JWT_SECRET);
  res.json({ token });
});

// ================== UPLOAD ==================

app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const user = users.find((u) => u.email === req.user);

    const fileBuffer = req.file.buffer;

    // 🔐 Encrypt file
    const encrypted = CryptoJS.AES.encrypt(
      fileBuffer.toString("base64"),
      user.password
    ).toString();

    // ☁️ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      "data:text/plain;base64," + Buffer.from(encrypted).toString("base64"),
      {
        folder: "privacy-locker",
        resource_type: "raw",
      }
    );

    console.log("UPLOAD SUCCESS:", result.secure_url);

    files.push({
      user: req.user,
      url: result.secure_url,
      public_id: result.public_id,
      originalName: req.file.originalname,
    });

    res.json({
      message: "Encrypted & uploaded to cloud",
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ================== FILE LIST ==================

app.get("/files", authMiddleware, (req, res) => {
  const userFiles = files.filter((f) => f.user === req.user);
  res.json(userFiles);
});

// ================== DOWNLOAD ==================

app.get("/download/:id", authMiddleware, async (req, res) => {
  try {
    const file = files.find((f) => f.public_id === req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    const user = users.find((u) => u.email === req.user);

    const response = await fetch(file.url);
    const encryptedData = await response.text();

    const bytes = CryptoJS.AES.decrypt(encryptedData, user.password);
    const decrypted = Buffer.from(bytes.toString(CryptoJS.enc.Utf8), "base64");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${file.originalName}`
    );

    res.send(decrypted);

  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    res.status(500).json({ message: "Download failed" });
  }
});

// ================== DELETE ==================

app.delete("/delete/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;

  console.log("Deleting:", id);

  try {
    // ✅ Always delete from Cloudinary (even if local memory lost)
    await cloudinary.uploader.destroy(id, {
      resource_type: "raw",
    });

    // Optional: remove from memory if exists
    files = files.filter((f) => f.public_id !== id);

    res.json({ message: "Deleted successfully" });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ================== SERVER ==================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});