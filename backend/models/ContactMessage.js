const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactSchema);
