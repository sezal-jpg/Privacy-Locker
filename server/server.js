require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const fetch = require("node-fetch");

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
    if (!user) return res.status(401).json({ message: "Login again" });

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
      url: result.secure_url,
      originalName: req.file.originalname,
    });

    console.log("UPLOADED:", result.public_id);

    res.json({ message: "File uploaded successfully" });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ================== FILE LIST ==================
app.get("/files", authMiddleware, (req, res) => {
  const userFiles = files.filter((f) => f.user === req.user);
  res.json(userFiles);
});

// ================== DOWNLOAD ==================
app.get("/download", authMiddleware, async (req, res) => {
  try {
    const id = req.query.id;

    if (!id)
      return res.status(400).json({ message: "No file ID provided" });

    const file = files.find(
      (f) => f.public_id === id && f.user === req.user
    );

    if (!file)
      return res.status(404).json({ message: "File not found" });

    const user = users.find((u) => u.email === req.user);

    const response = await fetch(file.url);
    const encryptedData = await response.text();

    const bytes = CryptoJS.AES.decrypt(encryptedData, user.password);
    const decrypted = Buffer.from(
      bytes.toString(CryptoJS.enc.Utf8),
      "base64"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );

    res.send(decrypted);

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Download failed" });
  }
});

// ================== VIEW ==================
app.get("/view", authMiddleware, async (req, res) => {
  try {
    const id = req.query.id;

    if (!id)
      return res.status(400).json({ message: "No file ID provided" });

    const file = files.find(
      (f) => f.public_id === id && f.user === req.user
    );

    if (!file)
      return res.status(404).json({ message: "File not found" });

    const user = users.find((u) => u.email === req.user);

    const response = await fetch(file.url);
    const encryptedData = await response.text();

    const bytes = CryptoJS.AES.decrypt(encryptedData, user.password);
    const decrypted = Buffer.from(
      bytes.toString(CryptoJS.enc.Utf8),
      "base64"
    );

    res.send(decrypted);

  } catch (err) {
    console.error("VIEW ERROR:", err);
    res.status(500).json({ message: "View failed" });
  }
});

// ================== DELETE (FINAL FIX) ==================
app.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const id = req.query.id;

    if (!id)
      return res.status(400).json({ message: "No file ID provided" });

    console.log("Deleting:", id);

    const result = await cloudinary.uploader.destroy(id, {
      resource_type: "raw",
    });

    console.log("Cloudinary result:", result);

    if (result.result === "ok" || result.result === "not found") {
      files = files.filter(
        (f) => !(f.public_id === id && f.user === req.user)
      );

      return res.json({ message: "File deleted successfully" });
    }

    res.status(400).json({ message: "Delete failed", result });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ================== SERVER ==================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});