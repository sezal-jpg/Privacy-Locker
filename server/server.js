require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = process.env.PORT || 5000;

const SECRET_KEY = "mysecretkey"; // you can change later

app.use(cors());
app.use(express.json());

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

// ================== ROUTES ==================

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "privacy-locker-backend",
  });
});

// Test API
app.get("/api", (req, res) => {
  res.json({
    message: "Privacy Locker API is running!",
  });
});

// ================== ENCRYPTED UPLOAD ==================

app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = "uploads/" + req.file.filename;

  const fileData = fs.readFileSync(filePath);

  const encrypted = CryptoJS.AES.encrypt(
    fileData.toString("base64"),
    SECRET_KEY
  ).toString();

  fs.writeFileSync(filePath, encrypted);

  res.json({
    message: "File uploaded and encrypted",
    file: req.file.filename,
  });
});

// ================== FILE LIST ==================

app.get("/files", (req, res) => {
  const files = fs.readdirSync("uploads");
  res.json(files);
});

// ================== DOWNLOAD (DECRYPT) ==================

app.get("/download/:filename", (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  const encryptedData = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
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

// ================== VIEW (DECRYPT) ==================

app.get("/view/:filename", (req, res) => {
  const filePath = "uploads/" + req.params.filename;

  const encryptedData = fs.readFileSync(filePath, "utf-8");

  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decrypted = Buffer.from(
    bytes.toString(CryptoJS.enc.Utf8),
    "base64"
  );

  // 👇 detect file type
  const ext = req.params.filename.split(".").pop();

  if (ext === "png" || ext === "jpg" || ext === "jpeg") {
    res.setHeader("Content-Type", "image/" + ext);
  } else if (ext === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
  } else if (ext === "txt") {
    res.setHeader("Content-Type", "text/plain");
  }

  res.send(decrypted);
});
// ================== DELETE ==================

app.delete("/delete/:filename", (req, res) => {
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