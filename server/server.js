require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ================== MULTER SETUP ==================

// Create uploads folder if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Storage config
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

// Upload file
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

// List files
app.get("/files", (req, res) => {
  const files = fs.readdirSync("uploads");
  res.json(files);
});

// ================== SERVER ==================
app.get("/download/:filename", (req, res) => {
  const filePath = "uploads/" + req.params.filename;
  res.download(filePath);
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});