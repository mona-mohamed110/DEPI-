// تغيير كلمة مرور مستخدم من قاعدة البيانات:
//   node resetPassword.js EMAIL NEW_PASSWORD
// كلمة المرور تُحفظ مشفّرة (bcrypt)، ويُسجَّل خروج المستخدم من كل أجهزته.
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: node resetPassword.js EMAIL NEW_PASSWORD");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.log("كلمة المرور يجب أن تكون 8 أحرف على الأقل وفيها حرف ورقم");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hashed = await bcrypt.hash(password, 10);
  const result = await User.updateOne(
    { email },
    { $set: { password: hashed, resetCode: "", resetToken: "" }, $inc: { tokenVersion: 1 } }
  );

  if (result.matchedCount === 0) {
    console.log("لا يوجد مستخدم بهذا البريد:", email);
    process.exitCode = 1;
  } else {
    console.log("تم تغيير كلمة المرور للمستخدم:", email);
  }
}

main()
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
