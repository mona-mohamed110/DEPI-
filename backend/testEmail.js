// اختبار إعداد البريد:  node testEmail.js you@example.com
require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

const to = process.argv[2] || process.env.EMAIL_USER;

sendEmail(to, "Shifa - test", "Email is working.")
  .then(() => console.log("تم الإرسال إلى", to))
  .catch((e) => {
    console.error("فشل الإرسال:", e.message);
    if (/Invalid login|535|Username and Password/i.test(e.message)) {
      console.error("استخدم كلمة مرور تطبيق (App Password) من 16 حرفاً بعد تفعيل التحقق بخطوتين، وليس كلمة مرور Gmail.");
    }
    process.exitCode = 1;
  });
