const mongoose = require("mongoose");

// رسالة / شكوى / اقتراح: من زائر (بدون حساب) أو من مستخدم مسجل، وللإدارة أن ترد عليها
const replySchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["admin", "user"], required: true },
    text: { type: String, required: true, maxlength: 2000 },
    byName: { type: String, default: "" },
    emailed: { type: Boolean, default: false }, // هل أُرسل الرد على البريد (للزوار)
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const contactSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["message", "complaint", "suggestion"], default: "message" },
    subject: { type: String, default: "", trim: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 2000 },

    // المرسل
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    role: { type: String, enum: ["visitor", "patient", "doctor", "lab", "reception", "admin"], default: "visitor" },
    name: { type: String, default: "", trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true, maxlength: 20 },

    status: { type: String, enum: ["new", "replied", "closed"], default: "new", index: true },
    adminUnread: { type: Boolean, default: true },
    userUnread: { type: Boolean, default: false },
    replies: { type: [replySchema], default: [] },

    read: { type: Boolean, default: false }, // قديم (قبل نظام الردود)
  },
  { timestamps: true }
);

contactSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactSchema);
