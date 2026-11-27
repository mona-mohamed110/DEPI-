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

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULTS = {
  brandName: "Shefaa", showBrandName: true, logoWidth: 120,
  pageBg: "#f4f6fa", cardBg: "#ffffff", brandColor: "#1d4ed8", textColor: "#1f2937", footerColor: "#6b7280",
  fontSize: 15, radius: 12,
  footerAr: "هذه رسالة من منصة شفاء الطبية. إذا لم تكن أنت من طلبها فتجاهلها.",
  footerEn: "This message was sent by the Shefaa medical platform. If you did not request it, you can ignore it.",
};

// قراءة التصميم المحفوظ (يرجع للافتراضي عند أي خطأ)
async function loadDesign() {
  try {
    const EmailDesign = require("../models/EmailDesign");
    const d = await EmailDesign.findOne({ key: "email" }).lean();
    return d ? { ...DEFAULTS, ...d } : { ...DEFAULTS };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

// رسالة HTML نظيفة + نسخة نصية. logoSrc: عنوان الشعار داخل الرسالة (cid: أو data:)
function renderHtml(text, d = DEFAULTS, logoSrc = "") {
  const c = (k) => (COLOR.test(d[k]) ? d[k] : DEFAULTS[k]);
  const rtl = /[\u0600-\u06FF]/.test(text);
  const body = esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")
    // الكود الرقمي بشكل واضح
    .replace(/(\b\d{6}\b)/g, `<span style="display:inline-block;font-size:26px;letter-spacing:6px;font-weight:700;color:${c("brandColor")};direction:ltr">$1</span>`);
  const footer = esc(rtl ? d.footerAr : d.footerEn);
  const width = Math.min(300, Math.max(40, Number(d.logoWidth) || 120));
  const head =
    (logoSrc ? `<img src="${logoSrc}" alt="${esc(d.brandName || "")}" width="${width}" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:${d.showBrandName ? 8 : 16}px">` : "") +
    (d.showBrandName && d.brandName ? `<div style="font-size:20px;font-weight:700;color:${c("brandColor")};margin-bottom:16px">${esc(d.brandName)}</div>` : "");
  const fs = Math.min(20, Math.max(12, Number(d.fontSize) || 15));
  const rd = Math.min(30, Math.max(0, Number(d.radius) || 0));
  return `<!doctype html><html lang="${rtl ? "ar" : "en"}" dir="${rtl ? "rtl" : "ltr"}"><body style="margin:0;padding:24px;background:${c("pageBg")};font-family:Tahoma,Arial,sans-serif;color:${c("textColor")}">
<div style="max-width:520px;margin:0 auto;background:${c("cardBg")};border-radius:${rd}px;padding:28px;line-height:1.8;font-size:${fs}px">
${head}
${body}
<hr style="border:0;border-top:1px solid #e5e7eb;margin:22px 0 12px">
<div style="font-size:12px;color:${c("footerColor")}">${footer}</div>
</div></body></html>`;
}

async function sendEmail(to, subject, text) {
  if (!emailConfigured()) {
    const err = new Error("إعدادات البريد غير مضبوطة في backend/.env (SMTP_* أو EMAIL_*)");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const { from, transporter } = buildTransport();
  const name = clean(process.env.MAIL_FROM_NAME) || "Shefaa";
  const addr = from.includes("<") ? from : `"${name}" <${from}>`;
  const bare = (addr.match(/<([^>]+)>/) || [])[1] || from;

  const design = await loadDesign();
  const hasLogo = design.logoData && design.logoData.length;
  const attachments = hasLogo
    ? [{ filename: "logo", content: Buffer.from(design.logoData.buffer || design.logoData), contentType: design.logoType || "image/png", cid: "shefaa-logo@mail", contentDisposition: "inline" }]
    : [];

  await transporter.sendMail({
    from: addr,
    to,
    replyTo: clean(process.env.MAIL_REPLY_TO) || bare,
    subject,
    text,
    html: renderHtml(text, design, hasLogo ? "cid:shefaa-logo@mail" : ""),
    attachments,
    headers: { "X-Auto-Response-Suppress": "OOF, AutoReply", "Auto-Submitted": "auto-generated" },
  });
}

sendEmail.emailConfigured = emailConfigured;
sendEmail.renderHtml = renderHtml;
sendEmail.loadDesign = loadDesign;
sendEmail.DEFAULTS = DEFAULTS;

module.exports = sendEmail;
