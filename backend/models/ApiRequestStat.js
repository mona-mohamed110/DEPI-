
const mongoose = require("mongoose");

const apiRequestStatSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ApiRequestStat ||
  mongoose.model("ApiRequestStat", apiRequestStatSchema);
