const mongoose = require("mongoose");

// تصميم رسائل البريد (مستند واحد)
const schema = new mongoose.Schema(
  {
    key: { type: String, default: "email", unique: true },
    brandName: { type: String, default: "Shefaa", maxlength: 60 },
    showBrandName: { type: Boolean, default: true },
    logoData: { type: Buffer, default: null },
    logoType: { type: String, default: "" },
    logoWidth: { type: Number, default: 120, min: 40, max: 300 },
    pageBg: { type: String, default: "#f4f6fa" },
    cardBg: { type: String, default: "#ffffff" },
    brandColor: { type: String, default: "#1d4ed8" },
    textColor: { type: String, default: "#1f2937" },
    footerColor: { type: String, default: "#6b7280" },
    fontSize: { type: Number, default: 15, min: 12, max: 20 },
    radius: { type: Number, default: 12, min: 0, max: 30 },
    footerAr: { type: String, default: "هذه رسالة من منصة شفاء الطبية. إذا لم تكن أنت من طلبها فتجاهلها.", maxlength: 300 },
    footerEn: { type: String, default: "This message was sent by the Shefaa medical platform. If you did not request it, you can ignore it.", maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.EmailDesign || mongoose.model("EmailDesign", schema);
