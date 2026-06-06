const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "File",
  FileSchema
);