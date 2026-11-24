
const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
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

    visit: {
      type: String,
      default: "consultation",
    },

    diagnosis: {
      type: String,
      default: "",
      trim: true,
    },

    items: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        dose: {
          type: String,
          required: true,
          trim: true,
        },
        duration: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    // التحاليل والأشعة المطلوبة في الكشف
    tests: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        kind: {
          type: String,
          enum: ["lab", "xray"],
          default: "lab",
        },
      },
    ],

    // أيام إعادة الكشف التي يحددها الطبيب لهذه الروشتة (null = المدة الافتراضية للطبيب)
    followUpDays: { type: Number, default: null, min: 1, max: 365 },
    // فترة سماح اختيارية بعد انتهاء الأيام (0 = بدون)
    graceDays: { type: Number, default: 0, min: 0, max: 60 },

    current: {
      type: Boolean,
      default: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, date: -1 });
prescriptionSchema.index({ doctorId: 1, date: -1 });

module.exports =
  mongoose.models.Prescription ||
  mongoose.model("Prescription", prescriptionSchema);
