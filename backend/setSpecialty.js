// تثبيت تخصص طبيب مباشرة في قاعدة البيانات (للحسابات التي سُجّلت بدون تخصص):
//   node setSpecialty.js EMAIL sp_cardio     -> يضبط تخصص طبيب واحد
//   node setSpecialty.js --backfill          -> ينسخ التخصص من حقل التسجيل (extra) لكل طبيب تخصصه فارغ
//   node setSpecialty.js --list              -> يعرض معرّفات التخصصات المتاحة
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const { SPECIALTIES } = require("./data/catalog");

async function main() {
  const a = process.argv[2];

  if (a === "--list") {
    SPECIALTIES.forEach((s) => console.log(s.id.padEnd(22), s.ar));
    return;
  }

  if (!a) {
    console.log("Usage: node setSpecialty.js EMAIL SPECIALTY_ID | --backfill | --list");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  if (a === "--backfill") {
    const docs = await User.find({ role: "doctor", $or: [{ specialty: "" }, { specialty: null }] });
    let n = 0;
    for (const d of docs) {
      if (SPECIALTIES.some((s) => s.id === d.extra)) {
        d.specialty = d.extra;
        await d.save();
        n += 1;
        console.log("تم:", d.email, "->", d.extra);
      }
    }
    console.log(`تم تثبيت تخصص ${n} طبيب من أصل ${docs.length} بدون تخصص`);
    return;
  }

  const email = String(a).trim().toLowerCase();
  const id = process.argv[3];

  if (!SPECIALTIES.some((s) => s.id === id)) {
    console.log("معرّف تخصص غير صحيح. شغّل: node setSpecialty.js --list");
    process.exitCode = 1;
    return;
  }

  const r = await User.updateOne({ email, role: "doctor" }, { $set: { specialty: id, extra: id } });
  console.log(r.matchedCount ? `تم تثبيت التخصص ${id} للطبيب ${email}` : "لا يوجد طبيب بهذا البريد: " + email);
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
