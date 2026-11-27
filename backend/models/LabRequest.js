
const mongoose = require("mongoose");

const labRequestSchema = new mongoose.Schema(
  {
labId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    name: { type: String, required: true },
    sex: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
    age: { type: Number, required: true },
phone: { type: String, default: "" },
    test: { type: String, required: true },
    kind: {
      type: String,
      enum: ["lab", "xray"],
      default: "lab",
    },
    doctor: { type: String, default: null },
    status: {
      type: String,
      enum: ["new", "progress", "done"],
      default: "new",
    },
    files: [{ type: String }],
    filePaths: [{ type: String }],
    resultStatus: { type: String, enum: ["normal", "low", "high", "followup"], default: "normal" },
    notes: { type: String, default: "" },
    uploadedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

labRequestSchema.index({ labId: 1, status: 1, createdAt: -1 });
labRequestSchema.index({ patientId: 1 });

module.exports =
  mongoose.models.LabRequest ||
  mongoose.model("LabRequest", labRequestSchema);
