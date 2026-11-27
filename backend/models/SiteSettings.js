const mongoose = require("mongoose");

// إعدادات عامة للموقع (مستند واحد)
const schema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    showTestimonials: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SiteSettings || mongoose.model("SiteSettings", schema);
