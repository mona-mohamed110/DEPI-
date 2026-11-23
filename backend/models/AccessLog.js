const mongoose = require("mongoose");

// سجل الاطلاع والإجراءات على ملف المريض (يظهر للمريض في صفحة الأذونات)
const accessLogSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
    action: {
      type: String,
      enum: [
        "viewed_file",
        "added_prescription",
        "uploaded_result",
        "granted_access",
        "revoked_access",
      ],
      required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: { createdAt: "at", updatedAt: false } }
);

accessLogSchema.index({ patientId: 1, at: -1 });

module.exports =
  mongoose.models.AccessLog || mongoose.model("AccessLog", accessLogSchema);
