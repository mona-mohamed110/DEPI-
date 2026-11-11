
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const labRoutes = require("./routes/lab");
const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patient");
const { trackApiRequests } = require("./middleware/apiStats");
const publicRoutes = require("./routes/public");
const app = express();

app.use(cors());
app.use("/api/public", publicRoutes);
app.use(express.json());

// تسجيل طلبات API قبل تشغيل الـ Routes
app.use("/api", trackApiRequests);
app.use("/api/lab", labRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", meRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/admin", adminRoutes);

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
