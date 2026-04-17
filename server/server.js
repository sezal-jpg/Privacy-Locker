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

// ================== MULTER ==================
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ================== AUTH ROUTES ==================

// ✅ FINAL SIGNUP (STRICT + SAFE)
app.post("/signup", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  console.log("Signup received:", username, password);

  // 🚨 FULL PROTECTION
  if (
    username === undefined ||
    password === undefined ||
    username === null ||
    password === null ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Username and password are required",
    });
  }

  username = username.trim();
  password = password.trim();

  if (username === "" || password === "") {
    return res.status(400).json({
      message: "Username and password cannot be empty",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  const existingUser = users.find((u) => u.username === username);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  users.push({ username, password: hashed });

  res.json({ message: "User registered successfully" });
});

// ✅ FINAL LOGIN
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  username = username.trim();
  password = password.trim();

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password required",
    });
  }

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

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

// ================== FILE UPLOAD ==================

app.post("/upload", authMiddleware, upload.single("file"), (req, res) => {
  const filePath = "uploads/" + req.file.filename;

  const user = users.find((u) => u.username === req.user);

  const fileData = fs.readFileSync(filePath);

  const encrypted = CryptoJS.AES.encrypt(
    fileData.toString("base64"),
    user.password
  ).toString();

  fs.writeFileSync(filePath, encrypted);

  res.json({ message: "Encrypted & uploaded", file: req.file.filename });
});

// ================== FILE LIST ==================

app.get("/files", authMiddleware, (req, res) => {
  res.json(fs.readdirSync("uploads"));
});

// ================== DOWNLOAD ==================

app.get("/download/:filename", authMiddleware, (req, res) => {
  const filePath = "uploads/" + req.params.filename;
  const user = users.find((u) => u.username === req.user);

  const encrypted = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encrypted, user.password);
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

  const encrypted = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encrypted, user.password);
  const decrypted = Buffer.from(
    bytes.toString(CryptoJS.enc.Utf8),
    "base64"
  );

  const ext = req.params.filename.split(".").pop();

  if (["png", "jpg", "jpeg"].includes(ext)) {
    res.setHeader("Content-Type", "image/" + ext);
  } else if (ext === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
  }

  res.send(decrypted);
});

// ================== DELETE ==================

app.delete("/delete/:filename", authMiddleware, (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: "Deleted successfully" });
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// ================== SERVER ==================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});