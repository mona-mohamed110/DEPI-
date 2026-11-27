
const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabRequest",
      default: null,
    },
    title: { type: String, default: "" },
    // نتيجة أضافها الطبيب يدويًا لمريض بدون حساب (يقدر يعدلها ويحذفها)
    byDoctor: { type: Boolean, default: false },
    kind: { type: String, enum: ["lab", "xray", "ecg", "other"], default: "lab" },
    status: {
      type: String,
      enum: ["normal", "low", "high", "followup"],
      default: "normal",
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "application/pdf",
    },
  },
  { timestamps: true }
);

labResultSchema.index({ patientId: 1, createdAt: -1 });

module.exports =
  mongoose.models.LabResult ||
  mongoose.model("LabResult", labResultSchema);
