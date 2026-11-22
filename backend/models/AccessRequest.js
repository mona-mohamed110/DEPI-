
const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requesterRole: {
      type: String,
      enum: ["doctor", "lab"],
      required: true,
    },
    scope: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AccessRequest ||
  mongoose.model("AccessRequest", accessRequestSchema);
