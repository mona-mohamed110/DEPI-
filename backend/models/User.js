const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  role: {
    type: String,
    enum: ["patient", "doctor", "lab", "reception", "admin"],
    default: "patient",
  },
  status: {
    type: String,
    enum: ["active", "pending", "disabled"],
    default: "active",
  },
  extra: { type: String, default: "" },
  license: { type: String, default: "" },
    resetCode: { type: String, default: "" },
  resetToken: { type: String, default: "" },
  resetExpires: { type: Date },
  profile: {
    birthDate: String,
    blood: String,
    height: Number,
    weight: Number,
    chronicIds: [String],
  },
});

module.exports = mongoose.model("User", userSchema);