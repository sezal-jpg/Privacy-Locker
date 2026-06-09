require("dotenv").config();

console.log("SERVER FILE LOADED - VERSION 999");
console.log(
  "RESEND KEY =",
  process.env.RESEND_API_KEY
);
const sendOtp = require(
  "./utils/sendOtp"
);
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
  .then(async () => {
    console.log("✅ MongoDB Connected");

    const users = await User.find();
    console.log("ALL USERS:", users);
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
   console.log("SIGNUP ROUTE HIT");
  try {
    let { email, password } = req.body;

    email = email?.trim();
    password = password?.trim();
console.log("STEP 1");
    const existingUser = await User.findOne({ email });
console.log("EXISTING USER:", existingUser);
    if (existingUser) {
      console.log("User Already Exists. Please sign up directly through Google.");
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

const otp = Math.floor(
  100000 + Math.random() * 900000
).toString();

const otpExpires = new Date(
  Date.now() + 10 * 60 * 1000
);

const newUser = await User.create({
  email,
  password: hashed,
  isVerified: false,
  otp,
  otpExpires,
});
console.log("STEP 2");
console.log("User created:", newUser);

console.log("Before sendOtp");
console.log("BEFORE SEND OTP");
console.log("STEP 3");
await sendOtp(email, otp);
console.log("STEP 4");
console.log("After sendOtp");
console.log("BEFORE SEND OTP");
console.log(
  "OTP sent successfully"
);
    res.json({
  message:
    "Signup successful. Please verify your email.",
});
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    res.status(500).json({
      message: "Signup failed",
    });
  }
});
// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  console.log("LOGIN ROUTE VERSION 777");

  let { email, password } = req.body;

  console.log("EMAIL RECEIVED:", email);
  console.log("PASSWORD RECEIVED:", password);

  email = email?.trim();
  password = password?.trim();

  const user = await User.findOne({
    email,
  });

  console.log("FOUND USER:", user);

  if (!user) {
    return res.status(400).json({
      message: "User not found",
    });
  }
  if (!user.isVerified) {
  return res.status(401).json({
    message: "Please verify your email first",
  });
}

  const match = await bcrypt.compare(
    password,
    user.password
  );

  console.log("PASSWORD MATCH:", match);

  if (!match) {
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

// ===== TEST ROUTE =====
app.get("/test-users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
app.get("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.query;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res
        .status(400)
        .send("User not found");
    }

    if (user.otp !== otp) {
      return res
        .status(400)
        .send("Invalid OTP");
    }

    if (new Date() > user.otpExpires) {
      return res
        .status(400)
        .send("OTP expired");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.send(
      "✅ Email verified successfully. You can now login."
    );

  } catch (err) {
    console.error(err);

    res.status(500).send(
      "Verification failed"
    );
  }
});
app.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.otp = otp;

    user.otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    await sendOtp(email, otp);

    res.json({
      message:
        "Verification email sent again",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to resend OTP",
    });
  }
});
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetToken = Math.random()
      .toString(36)
      .substring(2);

    user.resetToken = resetToken;

    user.resetTokenExpires =
      new Date(
        Date.now() + 15 * 60 * 1000
      );

    await user.save();

    // email sending next step

    res.json({
      message:
        "Password reset email sent",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Failed to send reset email",
    });
  }
});
// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});