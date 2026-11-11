const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", require("./routes/me"));

app.get("/", function (req, res) {
  res.send("Shifa backend is working");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB connected");
    app.listen(5000, function () {
      console.log("Server running on port 5000");
    });
  })
  .catch(function (error) {
    console.log("Connection error:", error.message);
  });