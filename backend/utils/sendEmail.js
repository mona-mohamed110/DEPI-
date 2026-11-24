const nodemailer = require("nodemailer");

// طريقتان للإرسال (الأولى لها الأولوية):
//  1) SMTP عام (Brevo أو أي خدمة): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
//  2) Gmail: EMAIL_USER + EMAIL_PASS (كلمة مرور تطبيق من 16 حرفاً)
function clean(v) {
  return String(v || "").trim();
}

function smtpConfigured() {
  return Boolean(clean(process.env.SMTP_HOST) && clean(process.env.SMTP_USER) && clean(process.env.SMTP_PASS));
}

function gmailConfigured() {
  return Boolean(clean(process.env.EMAIL_USER) && clean(process.env.EMAIL_PASS));
}

function emailConfigured() {
  return smtpConfigured() || gmailConfigured();
}

function buildTransport() {
  if (smtpConfigured()) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return {
      from: clean(process.env.MAIL_FROM) || clean(process.env.SMTP_USER),
      transporter: nodemailer.createTransport({
        host: clean(process.env.SMTP_HOST),
        port,
        secure: port === 465,
        auth: { user: clean(process.env.SMTP_USER), pass: clean(process.env.SMTP_PASS) },
      }),
    };
  }

  return {
    from: clean(process.env.EMAIL_USER),
    transporter: nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: clean(process.env.EMAIL_USER),
        // Google يعرض كلمة مرور التطبيق على شكل مجموعات بينها مسافات، والمسافات لا تُستخدم
        pass: clean(process.env.EMAIL_PASS).replace(/\s+/g, ""),
      },
    }),
  };
}

async function sendEmail(to, subject, text) {
  if (!emailConfigured()) {
    const err = new Error("إعدادات البريد غير مضبوطة في backend/.env (SMTP_* أو EMAIL_*)");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const { from, transporter } = buildTransport();
  await transporter.sendMail({ from, to, subject, text });
}

sendEmail.emailConfigured = emailConfigured;

module.exports = sendEmail;
