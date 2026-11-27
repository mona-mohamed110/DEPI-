// تفعيل التحقق بخطوتين لكل المستخدمين الحاليين:
//   node enable2fa.js --all          -> يفعّله للجميع
//   node enable2fa.js --off EMAIL    -> يوقفه لمستخدم واحد (مثلاً بريده غير حقيقي ولا يستطيع الدخول)
//   node enable2fa.js --reset        -> يوقفه عند الجميع (الوضع الافتراضي)، ثم يفعّله من يريد من إعداداته
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  const a = process.argv[2];
  if (a !== "--all" && a !== "--off" && a !== "--reset") {
    console.log("Usage: node enable2fa.js --all | --off EMAIL | --reset");
    process.exitCode = 1;
    return;
  }
  await mongoose.connect(process.env.MONGO_URI);
  if (a === "--reset") {
    const r = await User.updateMany({}, { $set: { twoFactor: false, loginCode: "", loginAttempts: 0 } });
    console.log("تم إيقاف التحقق بخطوتين عند", r.matchedCount, "مستخدم. كل مستخدم يفعّله من إعداداته إن أراد.");
  } else if (a === "--all") {
    const r = await User.updateMany({}, { $set: { twoFactor: true } });
    console.log("تم تفعيل التحقق بخطوتين لعدد", r.modifiedCount, "مستخدم (من أصل", r.matchedCount + ")");
  } else {
    const email = String(process.argv[3] || "").trim().toLowerCase();
    const r = await User.updateOne({ email }, { $set: { twoFactor: false } });
    console.log(r.matchedCount ? "تم إيقافه للمستخدم " + email : "لا يوجد مستخدم بهذا البريد");
  }
}
main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
