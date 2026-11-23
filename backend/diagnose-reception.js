// تشخيص (قراءة فقط، لا يغيّر شيئاً):  node diagnose-reception.js RECEPTION_EMAIL
// ضعه داخل backend ثم شغّله هناك.
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Booking = require("./models/Booking");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  if (!email) { console.log("Usage: node diagnose-reception.js RECEPTION_EMAIL"); return; }

  const src = fs.readFileSync(path.join(__dirname, "routes", "reception.js"), "utf8");
  console.log("ملف reception.js المحدّث:", src.includes("clinicPatientFilter") ? "نعم" : "لا (قديم، استبدله)");
  console.log("حقل createdByDoctor في User.js:", fs.readFileSync(path.join(__dirname, "models", "User.js"), "utf8").includes("createdByDoctor") ? "نعم" : "لا (قديم، استبدله)");

  await mongoose.connect(process.env.MONGO_URI);

  const rec = await User.findOne({ email }).select("name role doctorId status");
  if (!rec) { console.log("لا يوجد مستخدم بهذا البريد"); return; }
  console.log("\nالمستخدم:", rec.name, "| role:", rec.role, "| status:", rec.status);
  console.log("doctorId المحفوظ:", rec.doctorId ? String(rec.doctorId) : "(فارغ)");

  const doctor = rec.doctorId ? await User.findById(rec.doctorId).select("name email") : null;
  console.log("الطبيب التابع له:", doctor ? `${doctor.name} (${doctor.email})` : "(غير موجود)");

  const pend = await Booking.find({ status: "pending", kind: "doctor" })
    .populate("patientId", "name").populate("providerId", "name email");
  console.log("\nطلبات الحجز المعلقة في القاعدة (كل الأطباء):", pend.length);
  pend.forEach((b) => {
    const mine = rec.doctorId && b.providerId && String(b.providerId._id) === String(rec.doctorId);
    console.log(" -", b.patientId ? b.patientId.name : "?", "| عند الطبيب:", b.providerId ? `${b.providerId.name} (${b.providerId.email})` : "?", "|", b.date, b.time, "|", mine ? "تابع لطبيبك" : "طبيب آخر");
  });
}

main().catch((e) => console.error(e.message)).finally(() => mongoose.disconnect());
