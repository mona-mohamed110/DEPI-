// ملف وهمي بيحاكي السيرفر. بدّل كل دالة بالـ endpoint الحقيقي بتاعك.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login({ email, password }) {
  await wait(800);
  // مثال على الخطأ: throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  return { ok: true };
}

export async function register(data) {
  await wait(1000);
  // data = { role, fullName, email, phone, password, extra }
  return { ok: true };
}
