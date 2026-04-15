require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = "jwtsecret";

app.use(cors());
app.use(express.json());

// ================== USER STORAGE ==================
let users = [];

// ================== AUTH MIDDLEWARE ==================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.username;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================== MULTER SETUP ==================

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ================== AUTH ROUTES ==================

// Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  res.json({ message: "User registered successfully" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign({ username }, JWT_SECRET);

  res.json({ token });
});

// ================== ROUTES ==================

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api", (req, res) => {
  res.json({ message: "Privacy Locker API is running!" });
});

// ================== ENCRYPTED UPLOAD ==================

app.post("/upload", authMiddleware, upload.single("file"), (req, res) => {
  const filePath = "uploads/" + req.file.filename;

  const user = users.find((u) => u.username === req.user);

  const fileData = fs.readFileSync(filePath);

  const encrypted = CryptoJS.AES.encrypt(
    fileData.toString("base64"),
    user.password // 🔥 user-based encryption
  ).toString();

  fs.writeFileSync(filePath, encrypted);

  res.json({
    message: "File encrypted with user password",
    file: req.file.filename,
  });
});

// ================== FILE LIST ==================

app.get("/files", authMiddleware, (req, res) => {
  const files = fs.readdirSync("uploads");
  res.json(files);
});

// ================== DOWNLOAD ==================

app.get("/download/:filename", authMiddleware, (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  const user = users.find((u) => u.username === req.user);

  const encryptedData = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encryptedData, user.password);
  const decrypted = Buffer.from(
    bytes.toString(CryptoJS.enc.Utf8),
    "base64"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + req.params.filename
  );
  res.send(decrypted);
});

// ================== VIEW ==================

app.get("/view/:filename", authMiddleware, (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  const user = users.find((u) => u.username === req.user);

  const encryptedData = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encryptedData, user.password);
  const decrypted = Buffer.from(
    bytes.toString(CryptoJS.enc.Utf8),
    "base64"
  );

  const ext = req.params.filename.split(".").pop();

  if (["png", "jpg", "jpeg"].includes(ext)) {
    res.setHeader("Content-Type", "image/" + ext);
  } else if (ext === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
  } else if (ext === "txt") {
    res.setHeader("Content-Type", "text/plain");
  }

  res.send(decrypted);
});

// ================== DELETE ==================

app.delete("/delete/:filename", authMiddleware, (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted successfully" });
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// ================== SERVER ==================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});