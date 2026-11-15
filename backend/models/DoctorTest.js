
const mongoose = require("mongoose");

const doctorTestSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

doctorTestSchema.index(
  { doctorId: 1, name: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.DoctorTest ||
  mongoose.model("DoctorTest", doctorTestSchema);
