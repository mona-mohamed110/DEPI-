const mongoose = require("mongoose");

// تقييم: إما لطبيب/معمل (type=provider) من مريض بعد زيارة منتهية، أو للمنصة نفسها (type=platform) من أي مستخدم
const reviewSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["provider", "platform"], required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorRole: { type: String, default: "" },
    authorName: { type: String, default: "" },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    targetRole: { type: String, enum: ["doctor", "lab", ""], default: "" },
    targetName: { type: String, default: "" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "", maxlength: 500 },
    // الإدارة تحكم: pending -> approved / rejected. المعتمد فقط يظهر للعامة
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    // تقييمات المنصة المعتمدة فقط يمكن إظهارها في الصفحة الرئيسية (حد أقصى ٤)
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ authorId: 1, bookingId: 1 }, { unique: true, partialFilterExpression: { bookingId: { $type: "objectId" } } });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
