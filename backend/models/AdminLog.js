const mongoose = require("mongoose");

// سجل نشاط لوحة التحكم — لا يوجد مسار لتعديله أو حذفه
const adminLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    isSub: { type: Boolean, default: false },
    action: { type: String, required: true, index: true },
    target: { type: String, default: "" },
    detail: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema);
