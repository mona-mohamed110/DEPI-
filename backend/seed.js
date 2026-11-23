// بيانات تجريبية: node seed.js        (يضيف ما هو ناقص فقط، ولا يمسح شيئاً)
// ولإنشاء الفهارس فقط:  node seed.js --indexes
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Booking = require("./models/Booking");
const AccessGrant = require("./models/AccessGrant");
const AccessLog = require("./models/AccessLog");
const MedicalRecord = require("./models/MedicalRecord");
const Prescription = require("./models/Prescription");
const LabRequest = require("./models/LabRequest");
const ApiRequestStat = require("./models/ApiRequestStat");
const ContactMessage = require("./models/ContactMessage");
const DoctorTest = require("./models/DoctorTest");
const AccessRequest = require("./models/AccessRequest");
const LabResult = require("./models/LabResult");
const { TEST_CATALOG } = require("./data/catalog");

const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const week = (n, f, t) => Array.from({ length: 7 }, (_, i) => ({ on: i < n, from: f, to: t }));

async function upsertUser(email, password, data) {
  let u = await User.findOne({ email });
  if (u) return u;
  return User.create({ email, password: await bcrypt.hash(password, 10), status: "active", ...data });
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // إنشاء المجموعات والفهارس (آمن للتكرار)
  for (const M of [User, Booking, AccessGrant, AccessLog, AccessRequest, MedicalRecord, Prescription, LabRequest, LabResult, DoctorTest, ApiRequestStat, ContactMessage]) {
    await M.createCollection().catch(() => {});
    await M.syncIndexes().catch((e) => console.log("index warning", M.modelName, e.message));
  }
  console.log("Collections and indexes ready");
  if (process.argv.includes("--indexes")) return;

  const patient = await upsertUser("patient@shefaa.com", "Patient@123", {
    name: "منى محمد", role: "patient", phone: "01012345678",
    profile: { birthDate: "1999-04-10", blood: "O+", height: 165, weight: 60, chronicIds: ["diabetes", "hypertension"] },
  });
  const doctor = await upsertUser("doctor@shefaa.com", "Doctor@123", {
    name: "د. أحمد سمير", role: "doctor", phone: "01000000000", specialty: "باطنة", clinic: "عيادة الشفاء",
    address: "١٢ شارع الجمهورية، المنصورة", license: "EG-2014-58231", licenseStatus: "ok",
    schedule: week(5, "10:00", "17:00"),
  });
  await upsertUser("reception@shefaa.com", "Reception@123", {
    name: "أمل محروس", role: "reception", phone: "01077777777", doctorId: doctor._id,
  });
  const lab = await upsertUser("lab@shefaa.com", "Lab@12345", {
    name: "معمل الأمل", role: "lab", phone: "0502345678", license: "LB-2019-4471", address: "٢٥ شارع الجلاء، المنصورة",
    labProfile: { phone: "0502345678", hours: week(6, "08:00", "20:00"), tests: TEST_CATALOG.map((name) => ({ name, on: true })) },
  });
  await upsertUser("admin@shefaa.com", "Admin@123", { name: "مدير النظام", role: "admin", phone: "01099999999" });

  if (!(await MedicalRecord.findOne({ patientId: patient._id }))) {
    await MedicalRecord.create({
      patientId: patient._id,
      history: [{ condition: "استئصال الزائدة", date: "2019-06-12", notes: "عملية جراحية ناجحة" }],
    });
  }
  if (!(await AccessGrant.findOne({ patientId: patient._id, doctorId: doctor._id }))) {
    await AccessGrant.create({ patientId: patient._id, doctorId: doctor._id, until: new Date(Date.now() + 30 * 86400000) });
  }
  if (!(await Booking.findOne({ patientId: patient._id, providerId: doctor._id }))) {
    await Booking.create({ patientId: patient._id, providerId: doctor._id, kind: "doctor", date: day(1), time: "10:30", status: "confirmed" });
  }
  if (!(await Prescription.findOne({ patientId: patient._id }))) {
    await Prescription.create({
      patientId: patient._id, doctorId: doctor._id, visit: "followup", diagnosis: "متابعة السكري والضغط",
      items: [{ name: "Metformin 500 mg", dose: "قرص مرتين يومياً", duration: "٣ أشهر" }],
    });
  }
  if (!(await LabRequest.findOne({ patientId: patient._id }))) {
    await LabRequest.create({ labId: lab._id, patientId: patient._id, name: patient.name, age: 27, sex: "female", phone: patient.phone, test: "HbA1c", kind: "lab" });
  }
  if (!(await AccessLog.findOne({ patientId: patient._id }))) {
    await AccessLog.create({ patientId: patient._id, actorId: doctor._id, actorName: doctor.name, action: "viewed_file" });
  }
  console.log("Demo data ready (patient/doctor/reception/lab/admin @shefaa.com)");
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
