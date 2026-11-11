
const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    history: [
      {
        condition: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: String,
          default: "",
        },
        notes: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    reports: [
      {
        name: {
          type: String,
          required: true,
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
          default: "",
        },
        size: {
          type: Number,
          default: 0,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MedicalRecord ||
  mongoose.model("MedicalRecord", medicalRecordSchema);
