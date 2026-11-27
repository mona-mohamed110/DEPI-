
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    kind: {
      type: String,
      enum: ["doctor", "lab"],
      required: true,
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    examinedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "confirmed", "done", "cancelled", "rejected"],
      default: "pending",
    },
    test: { type: String, default: null },
    // رفض الاستقبال للطلب: السبب (اختياري) وهل رآه المريض
    rejectReason: { type: String, default: "", maxlength: 200 },
    rejectedAt: { type: Date, default: null },
    rejectSeen: { type: Boolean, default: true },
    source: { type: String, default: "app" },
    // نوع الزيارة: يُحسب من تاريخ آخر روشتة للمريض عند هذا الطبيب (null = يُحسب عند العرض)
    visitType: { type: String, enum: ["new", "followup", "consult", null], default: null },
    queue: {
      type: String,
      enum: ["not-arrived", "arrived", "in-exam", "ended"],
      default: "not-arrived",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ providerId: 1, date: 1, time: 1 });
bookingSchema.index({ patientId: 1, date: 1 });
bookingSchema.index({ providerId: 1, status: 1, date: 1 });

module.exports =
  mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
