
const mongoose = require("mongoose");

const labRequestSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    notes: { type: String, default: "" },
    uploadedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.LabRequest ||
  mongoose.model("LabRequest", labRequestSchema);
