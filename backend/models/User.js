
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },

    password: {
      type: String,
      default: "",
    },

    phone: { type: String, default: "" },

    role: {
      type: String,
      enum: ["patient", "doctor", "lab", "reception", "admin"],
      default: "patient",
    },

    status: {
      type: String,
      enum: ["active", "pending", "disabled"],
      default: "active",
    },

    lastActiveAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },

    extra: { type: String, default: "" },

    // بيانات الطبيب المهنية
    specialty: { type: String, default: "" },
    clinic: { type: String, default: "" },
    address: { type: String, default: "" },

    // بيانات الترخيص والشهادة
    license: { type: String, default: "" },
    certificate: { type: String, default: "" },

    licenseStatus: {
      type: String,
      enum: ["pend", "ok", "no"],
      default: "pend",
    },

    licenseReason: { type: String, default: "" },
    licenseBy: { type: String, default: "" },
    licenseSentAt: { type: Date },

    certificateName: { type: String, default: "" },
    certificateType: { type: String, default: "" },

    resetCode: { type: String, default: "" },
    resetToken: { type: String, default: "" },
    resetExpires: { type: Date },

    profile: {
      birthDate: String,
      blood: String,
      height: Number,
      weight: Number,
      chronicIds: [String],
    },

    // موقع العيادة/المعمل على الخريطة
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },

    // مواعيد عمل الطبيب (7 أيام، الأحد = 0)
    schedule: {
      type: [{ _id: false, on: Boolean, from: String, to: String }],
      default: undefined,
    },

    // بيانات المعمل
    labProfile: {
      phone: { type: String, default: "" },
      hours: {
        type: [{ _id: false, on: Boolean, from: String, to: String }],
        default: undefined,
      },
      tests: {
        type: [{ _id: false, name: String, on: Boolean }],
        default: undefined,
      },
    },

    notifEmail: { type: Boolean, default: true },
    notifAppt: { type: Boolean, default: true },
    notifMeds: { type: Boolean, default: true },
    notifAccess: { type: Boolean, default: true },
    notifNew: { type: Boolean, default: true },
    twoFactor: { type: Boolean, default: false },

    // بيانات موظف الاستقبال
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // مريض أضافه موظف الاستقبال (بدون حساب دخول) يتبع هذا الطبيب
    createdByDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    perms: {
      type: [Boolean],
      default: [true, true, true],
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ doctorId: 1 });
userSchema.index({ phone: 1 });

// الإيميل فريد للحسابات التي لديها إيميل فقط
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
