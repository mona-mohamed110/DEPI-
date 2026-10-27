// ملف وهمي بيحاكي السيرفر. بدّل كل دالة بالـ endpoint الحقيقي بتاعك.
// مثال:
//   const res = await fetch("/api/auth/forgot-password", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email }),
//   });
//   if (!res.ok) throw new Error((await res.json()).message);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// يبعت كود التحقق على الإيميل
export async function sendCode(email) {
  await wait(800);
  return { ok: true };
}

// يتحقق من الكود (في النسخة الوهمية الكود الصحيح هو 123456)
export async function verifyCode(email, code) {
  await wait(800);
  if (code !== "123456") {
    throw new Error("الرمز غير صحيح. حاول مرة أخرى.");
  }
  return { ok: true };
}

// يحدّث الباسورد
export async function resetPassword({ email, code, password }) {
  await wait(900);
  return { ok: true };
}
