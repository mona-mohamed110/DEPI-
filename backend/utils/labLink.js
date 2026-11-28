const User = require("../models/User");
const LabRequest = require("../models/LabRequest");
const LabResult = require("../models/LabResult");

const AR = "٠١٢٣٤٥٦٧٨٩";
// رقم الهاتف بآخر 10 أرقام (يتجاهل +20 والصفر الأول والمسافات والأرقام العربية)
function tail10(phone) {
  const d = String(phone || "").replace(/[٠-٩]/g, (c) => AR.indexOf(c)).replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

async function findPatientByPhone(phone) {
  const d = tail10(phone);
  if (!d) return null;
  return User.findOne({ role: "patient", phone: { $in: [`0${d}`, d, `20${d}`, `+20${d}`] } }).select("_id");
}

// ربط طلبات المعمل المنتهية التي لم تُربط بحساب مريض (الرقم لم يطابق وقتها) عند دخول المريض صاحب الرقم
async function claimOrphans(user) {
  const d = tail10(user.phone);
  if (!d) return;
  const orphans = await LabRequest.find({
    patientId: null,
    status: "done",
    phone: { $in: [`0${d}`, d, `20${d}`, `+20${d}`] },
  });
  for (const r of orphans) {
    const exists = await LabResult.exists({ requestId: r._id });
    if (!exists && r.filePaths && r.filePaths.length) {
      await LabResult.insertMany(
        r.filePaths.map((fp, i) => ({
          patientId: user._id,
          labId: r.labId,
          bookingId: r.bookingId,
          requestId: r._id,
          title: r.test,
          kind: ["lab", "xray", "ecg", "other"].includes(r.kind) ? r.kind : "lab",
          status: r.resultStatus || "normal",
          fileName: (r.files && r.files[i]) || fp.split("/").pop(),
          filePath: fp,
          fileType: /\.pdf$/i.test(fp) ? "application/pdf" : "image/jpeg",
        }))
      );
    }
    r.patientId = user._id;
    await r.save();
  }
}

module.exports = { findPatientByPhone, claimOrphans };
