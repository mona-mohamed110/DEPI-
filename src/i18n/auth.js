// ترجمة صفحات الدخول والتسجيل ونسيت كلمة المرور (بتتجمع مع ترجمة الصفحة الرئيسية لأن فيها النافبار)
import { merge } from './common.js';
import { homeDict } from './home.js';

const base = {
  ar: {
    lg_title: 'مرحباً بعودتك', lg_sub: 'سجّل دخولك للوصول إلى لوحتك', lg_email: 'البريد الإلكتروني', lg_pass: 'كلمة المرور', lg_forgot: 'نسيت كلمة المرور؟', lg_btn: 'تسجيل الدخول', lg_ing: 'جاري التحقق...',
    lg_no_acc: 'ليس لديك حساب؟', lg_reg: 'إنشاء حساب جديد', lg_show: 'إظهار كلمة المرور', lg_hide: 'إخفاء كلمة المرور', lg_need: 'اكتب بريداً إلكترونياً صحيحاً وكلمة المرور',
    lg_locked: 'محاولات كثيرة خاطئة. حاول بعد {n} ثانية', lg_demo: 'حسابات تجريبية (بيانات وهمية)', lg_demo_hint: 'اضغط على أي حساب لتعبئة البيانات', lg_registered: 'تم إنشاء حسابك. سجّل دخولك الآن.',
    lg_registered_pending: 'تم إنشاء حسابك وإرسال الترخيص للمراجعة. سيتم إبلاغك على البريد الإلكتروني.',
    rg_title: 'إنشاء حساب جديد', rg_sub: 'اختر نوع الحساب وأكمل بياناتك', rg_as: 'التسجيل كـ', rg_patient: 'مريض', rg_doctor: 'طبيب', rg_lab: 'معمل / أشعة',
    rg_name: 'الاسم بالكامل', rg_lab_name: 'اسم المعمل', rg_email: 'البريد الإلكتروني', rg_phone: 'رقم الهاتف', rg_pass: 'كلمة المرور', rg_confirm: 'تأكيد كلمة المرور',
    rg_specialty: 'التخصص', rg_license: 'رقم الترخيص', rg_license_note: 'سيتم مراجعة الترخيص من الإدارة قبل التفعيل الكامل.', rg_btn: 'إنشاء الحساب', rg_ing: 'جاري الإنشاء...', rg_have: 'لديك حساب بالفعل؟',
    rg_err_name: 'الاسم ٣ حروف على الأقل', rg_err_email: 'بريد إلكتروني غير صحيح', rg_err_phone: 'رقم هاتف مصري غير صحيح', rg_err_pass: 'كلمة المرور ٨ حروف على الأقل وفيها حرف ورقم', rg_err_match: 'كلمتا المرور غير متطابقتين', rg_err_license: 'اكتب رقم الترخيص', rg_err_terms: 'يجب الموافقة على الشروط',
    rg_birth: 'تاريخ الميلاد', rg_blood: 'فصيلة الدم', rg_height: 'الطول (سم)', rg_weight: 'الوزن (كجم)', rg_chronic: 'الأمراض المزمنة (إن وجدت) — اختر أكثر من خيار', rg_chronic_none: 'لا يوجد', rg_cert: 'الشهادة (صورة أو PDF)', rg_cert_pick: 'اختر ملف الشهادة', rg_cert_hint: 'شهادة مزاولة المهنة / ترخيص المعمل — حتى ٥ ميجا', rg_err_cert: 'ارفع صورة أو ملف PDF للشهادة', rg_err_birth: 'اختر تاريخ ميلاد صحيح', rg_err_blood: 'اختر فصيلة الدم', rg_health: 'بياناتك الصحية',
    rg_terms: 'أوافق على الشروط والأحكام وسياسة الخصوصية',
    sp_internal: 'باطنة', sp_cardio: 'قلب', sp_neuro: 'مخ وأعصاب', sp_peds: 'أطفال', sp_derm: 'جلدية', sp_ortho: 'عظام',
    fp_title: 'نسيت كلمة المرور؟', fp_sub: 'اكتب بريدك الإلكتروني وسنرسل لك كود التحقق', fp_send: 'إرسال الكود', fp_sending: 'جاري الإرسال...',
    fp_code_title: 'أدخل كود التحقق', fp_code_sub: 'أرسلنا كوداً من ٦ أرقام إلى {email}', fp_code_ph: '••••••', fp_verify: 'تأكيد الكود', fp_resend: 'إعادة إرسال الكود', fp_resent: 'تم إرسال كود جديد', fp_dev: 'وضع التجربة — الكود: {code}',
    fp_new_title: 'كلمة مرور جديدة', fp_new_sub: 'اختر كلمة مرور قوية لحسابك', fp_save: 'حفظ كلمة المرور', fp_done_title: 'تم تغيير كلمة المرور', fp_done_sub: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة', fp_back: 'العودة لتسجيل الدخول',
    rt_checking: 'جاري التحقق من الجلسة...',
  },
  en: {
    lg_title: 'Welcome back', lg_sub: 'Log in to reach your dashboard', lg_email: 'Email', lg_pass: 'Password', lg_forgot: 'Forgot password?', lg_btn: 'Log in', lg_ing: 'Verifying...',
    lg_no_acc: "Don't have an account?", lg_reg: 'Create a new account', lg_show: 'Show password', lg_hide: 'Hide password', lg_need: 'Enter a valid email and your password',
    lg_locked: 'Too many failed attempts. Try again in {n} seconds', lg_demo: 'Demo accounts (fake data)', lg_demo_hint: 'Click any account to fill in the details', lg_registered: 'Your account was created. Log in now.',
    lg_registered_pending: 'Your account was created and your license was sent for review. You will be notified by email.',
    rg_title: 'Create a new account', rg_sub: 'Choose the account type and complete your details', rg_as: 'Register as', rg_patient: 'Patient', rg_doctor: 'Doctor', rg_lab: 'Lab / imaging',
    rg_name: 'Full name', rg_lab_name: 'Lab name', rg_email: 'Email', rg_phone: 'Phone number', rg_pass: 'Password', rg_confirm: 'Confirm password',
    rg_specialty: 'Specialty', rg_license: 'License number', rg_license_note: 'Your license will be reviewed by the admin before full activation.', rg_btn: 'Create account', rg_ing: 'Creating...', rg_have: 'Already have an account?',
    rg_err_name: 'Name must be at least 3 characters', rg_err_email: 'Invalid email address', rg_err_phone: 'Invalid Egyptian phone number', rg_err_pass: 'At least 8 characters with a letter and a number', rg_err_match: "Passwords don't match", rg_err_license: 'Enter the license number', rg_err_terms: 'You must accept the terms',
    rg_birth: 'Date of birth', rg_blood: 'Blood type', rg_height: 'Height (cm)', rg_weight: 'Weight (kg)', rg_chronic: 'Chronic diseases (if any) — pick one or more', rg_chronic_none: 'None', rg_cert: 'Certificate (image or PDF)', rg_cert_pick: 'Choose the certificate file', rg_cert_hint: 'Practice certificate / lab license — up to 5 MB', rg_err_cert: 'Upload an image or PDF of the certificate', rg_err_birth: 'Choose a valid date of birth', rg_err_blood: 'Choose the blood type', rg_health: 'Your health data',
    rg_terms: 'I agree to the terms & conditions and privacy policy',
    sp_internal: 'Internal medicine', sp_cardio: 'Cardiology', sp_neuro: 'Neurology', sp_peds: 'Pediatrics', sp_derm: 'Dermatology', sp_ortho: 'Orthopedics',
    fp_title: 'Forgot your password?', fp_sub: 'Enter your email and we will send you a verification code', fp_send: 'Send code', fp_sending: 'Sending...',
    fp_code_title: 'Enter the verification code', fp_code_sub: 'We sent a 6-digit code to {email}', fp_code_ph: '••••••', fp_verify: 'Verify code', fp_resend: 'Resend code', fp_resent: 'A new code was sent', fp_dev: 'Demo mode — code: {code}',
    fp_new_title: 'New password', fp_new_sub: 'Choose a strong password for your account', fp_save: 'Save password', fp_done_title: 'Password changed', fp_done_sub: 'You can now log in with your new password', fp_back: 'Back to log in',
    rt_checking: 'Checking your session...',
  },
};
export const authDict = merge(homeDict, base);
