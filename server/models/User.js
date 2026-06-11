const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  otp: {
    type: String,
    default: null,
  },

  otpExpires: {
    type: Date,
    default: null,
  },
  resetToken: {
  type: String,
  default: null,
},

resetTokenExpires: {
  type: Date,
  default: null,
},
encryptionKey: {
  type: String,
  required: true,
},
});
module.exports = mongoose.model(
  "User",
  UserSchema
);