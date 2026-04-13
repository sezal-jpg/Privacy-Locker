require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check route — required for AWS ALB later
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "privacy-locker-backend" 
  });
});

// Test route
app.get("/api", (req, res) => {
  res.json({ 
    message: "Privacy Locker API is running!" 
  });
});

// File routes placeholder
app.get("/api/files", (req, res) => {
  res.json({ 
    files: [], 
    message: "No files yet" 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});