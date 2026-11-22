
const mongoose = require("mongoose");

const accessGrantSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

accessGrantSchema.index(
  { patientId: 1, doctorId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.AccessGrant ||
  mongoose.model("AccessGrant", accessGrantSchema);
