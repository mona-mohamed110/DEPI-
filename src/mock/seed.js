// ======================================================================
//  بيانات وهمية للاختبار فقط (ملف خارجي) — لحد ما الـ Database والمستخدمين الحقيقيين يجهزوا
//  لما تحط VITE_API_URL في .env الملف ده والـ mockServer مش بيتحملوا خالص.
//
//  حسابات تجريبية (البريد / كلمة المرور):
//    مريض    patient@shefaa.com    / Patient@123     (منى محمد)
//    مريض 2  patient2@shefaa.com   / Patient@123     (أحمد حسن)
//    طبيب    doctor@shefaa.com     / Doctor@123      (د. أحمد سمير)
//    معمل    lab@shefaa.com        / Lab@12345       (معمل الأمل)
//    استقبال reception@shefaa.com  / Reception@123   (أمل محروس)
//    أدمن    admin@shefaa.com      / Admin@123       (مدير النظام)
//  أي حساب جديد من صفحة التسجيل بيدخل على لوحته بداتا فاضية خاصة بيه.
// ======================================================================
import { TEST_CATALOG } from '../config/catalog.js';
export { TEST_CATALOG };
export const SEED_VERSION = 4;

const H = 3600 * 1000, D = 24 * H;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const ago = (h) => iso(now - h * H);
const dayKey = (offsetDays) => { const d = new Date(now + offsetDays * D); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ar = (a, e) => ({ ar: a, en: e });

const notif = { notifEmail: true, notifAppt: true, notifMeds: true, notifAccess: true, notifNew: true, twoFactor: true };

export function buildSeed() {
  const users = [
    { id: 'u_patient', role: 'patient', name: ar('منى محمد', 'Mona Mohamed'), email: 'patient@shefaa.com', password: 'Patient@123', phone: '01012345678', status: 'active', createdAt: ago(900), ...notif },
    { id: 'u_patient2', role: 'patient', name: ar('أحمد حسن', 'Ahmed Hassan'), email: 'patient2@shefaa.com', password: 'Patient@123', phone: '01112223344', status: 'active', createdAt: ago(700), ...notif },
    { id: 'u_doctor', role: 'doctor', name: ar('د. أحمد سمير', 'Dr. Ahmed Samir'), email: 'doctor@shefaa.com', password: 'Doctor@123', phone: '01000000000', status: 'active', createdAt: ago(2000), ...notif },
    { id: 'u_doctor2', role: 'doctor', name: ar('د. سارة علي', 'Dr. Sara Ali'), email: 'sara@shefaa.com', password: 'Doctor@123', phone: '01055555555', status: 'active', createdAt: ago(1800), ...notif },
    { id: 'u_lab', role: 'lab', name: ar('معمل الأمل', 'Al-Amal Lab'), email: 'lab@shefaa.com', password: 'Lab@12345', phone: '0502345678', status: 'active', createdAt: ago(1500), ...notif },
    { id: 'u_reception', role: 'reception', name: ar('أمل محروس', 'Amal Mahrous'), email: 'reception@shefaa.com', password: 'Reception@123', phone: '01077777777', status: 'active', createdAt: ago(600), doctorId: 'u_doctor', ...notif },
    { id: 'u_admin', role: 'admin', name: ar('مدير النظام', 'System Admin'), email: 'admin@shefaa.com', password: 'Admin@123', phone: '01099999999', status: 'active', createdAt: ago(3000), ...notif },
  ];

  // ---------------- المرضى (داتا لكل مريض على حدة) ----------------
  const birth = (years) => dayKey(-365 * years - 40);
  const dr1 = ar('د. أحمد سمير', 'Dr. Ahmed Samir'), dr2 = ar('د. سارة علي', 'Dr. Sara Ali'), dr3 = ar('د. هبة نبيل', 'Dr. Heba Nabil');
  const sp = { internal: ar('باطنة', 'Internal medicine'), cardio: ar('قلب', 'Cardiology'), peds: ar('أطفال', 'Pediatrics') };
  const full = ar('الملف الطبي كامل', 'Full medical file');
  const patients = {
    u_patient: {
      info: { birthDate: birth(25), blood: 'O+', height: 165, weight: 60 },
      chronic: [ar('السكري', 'Diabetes'), ar('ضغط الدم', 'Hypertension')],
      history: [
        { id: 'h1', condition: ar('استئصال الزائدة', 'Appendectomy'), date: '2019-06-12', notes: ar('عملية جراحية ناجحة', 'Successful surgery') },
        { id: 'h2', condition: ar('التهاب الجيوب الأنفية', 'Sinusitis'), date: '2023-02-03', notes: ar('حالة موسمية', 'Seasonal condition') },
      ],
      reports: [
        { id: 'r1', name: 'Blood_Test_Report.pdf', type: 'pdf', size: 2400000, date: ago(300), url: '' },
        { id: 'r2', name: 'Chest_XRay.jpg', type: 'image', size: 1100000, date: ago(250), url: '' },
      ],
      prescriptions: [
        { id: 'p1', doctorId: 'u_doctor', doctor: dr1, specialty: sp.internal, visit: 'followup', diagnosis: ar('متابعة السكري والضغط', 'Diabetes & blood pressure follow-up'), date: ago(240), current: true,
          items: [{ name: 'Metformin 500 mg', dose: ar('قرص مرتين يومياً', 'One tablet twice daily'), duration: ar('٣ أشهر', '3 months') }, { name: 'Amlodipine 5 mg', dose: ar('قرص صباحاً', 'One tablet in the morning'), duration: ar('٣ أشهر', '3 months') }] },
        { id: 'p2', doctorId: 'u_doctor2', doctor: dr2, specialty: sp.cardio, visit: 'new', diagnosis: ar('نقص فيتامين د', 'Vitamin D deficiency'), date: ago(480), current: true,
          items: [{ name: 'Vitamin D 50000 IU', dose: ar('كبسولة أسبوعياً', 'One capsule weekly'), duration: ar('٨ أسابيع', '8 weeks') }] },
        { id: 'p3', doctorId: 'p_x', doctor: dr3, specialty: sp.peds, visit: 'new', diagnosis: ar('التهاب لوزتين', 'Tonsillitis'), date: ago(5000), current: false,
          items: [{ name: 'Amoxicillin 1 g', dose: ar('قرص ٣ مرات يومياً', 'One tablet 3 times daily'), duration: ar('٧ أيام', '7 days') }, { name: 'Paracetamol 500 mg', dose: ar('عند اللزوم', 'As needed'), duration: ar('٣ أيام', '3 days') }] },
      ],
      results: [
        { id: 'x1', kind: 'lab', title: ar('تحليل سكر صائم', 'Fasting blood sugar'), source: ar('معمل الأمل', 'Al-Amal Lab'), date: ago(48), status: 'normal', fileUrl: '' },
        { id: 'x2', kind: 'lab', title: ar('صورة دم كاملة CBC', 'Complete blood count (CBC)'), source: ar('معمل الأمل', 'Al-Amal Lab'), date: ago(150), status: 'low', fileUrl: '' },
        { id: 'x3', kind: 'xray', title: ar('أشعة على الصدر', 'Chest X-ray'), source: ar('مركز النور', 'Al-Noor Center'), date: ago(400), status: 'normal', fileUrl: '' },
        { id: 'x4', kind: 'ecg', title: ar('رسم قلب ECG', 'ECG'), source: dr2, date: ago(330), status: 'followup', fileUrl: '' },
      ],
      permissions: {
        active: [
          { id: 'g1', granteeId: 'u_doctor', grantee: dr1, kind: 'doctor', scope: full, until: dayKey(20) },
          { id: 'g2', granteeId: 'u_lab', grantee: ar('معمل الأمل', 'Al-Amal Lab'), kind: 'lab', scope: ar('الطلبات المطلوبة فقط', 'Requested tests only'), until: null },
          { id: 'g3', granteeId: 'u_doctor2', grantee: dr2, kind: 'doctor', scope: full, until: dayKey(8) },
        ],
        log: [
          { id: 'l1', who: dr1, action: ar('اطلع على الملف الطبي', 'Viewed the medical file'), at: ago(5) },
          { id: 'l2', who: ar('معمل الأمل', 'Al-Amal Lab'), action: ar('رفع نتيجة تحليل', 'Uploaded a lab result'), at: ago(48) },
          { id: 'l3', who: dr1, action: ar('أضاف روشتة جديدة', 'Added a new prescription'), at: ago(240) },
        ],
      },
    },
    u_patient2: {
      info: { birthDate: birth(45), blood: 'A+', height: 178, weight: 88 },
      chronic: [ar('ارتفاع الكوليسترول', 'High cholesterol')],
      history: [{ id: 'h1', condition: ar('كسر في الذراع', 'Arm fracture'), date: '2015-08-20', notes: ar('تم العلاج بالجبس', 'Treated with a cast') }],
      reports: [],
      prescriptions: [{ id: 'p1', doctorId: 'u_doctor', doctor: dr1, specialty: sp.internal, visit: 'new', diagnosis: ar('ارتفاع الدهون', 'High lipids'), date: ago(120), current: true,
        items: [{ name: 'Atorvastatin 20 mg', dose: ar('قرص مساءً', 'One tablet in the evening'), duration: ar('٣ أشهر', '3 months') }] }],
      results: [{ id: 'x1', kind: 'lab', title: ar('تحليل دهون', 'Lipid profile'), source: ar('معمل الأمل', 'Al-Amal Lab'), date: ago(100), status: 'followup', fileUrl: '' }],
      permissions: { active: [{ id: 'g1', granteeId: 'u_doctor', grantee: dr1, kind: 'doctor', scope: full, until: dayKey(10) }], log: [] },
    },
  };

  // ---------------- الحجوزات (مريض ↔ دكتور/معمل ↔ موظف الاستقبال) ----------------
  const today = dayKey(0);
  const bookings = [
    // حجوزات المريض الأول
    { id: 'b_a1', kind: 'doctor', providerId: 'u_doctor', patientId: 'u_patient', patientName: ar('منى محمد', 'Mona Mohamed'), phone: '01012345678', date: dayKey(1), time: '10:30', status: 'confirmed', queue: 'not-arrived', source: 'app' },
    { id: 'b_a2', kind: 'doctor', providerId: 'u_doctor2', patientId: 'u_patient', patientName: ar('منى محمد', 'Mona Mohamed'), phone: '01012345678', date: dayKey(3), time: '16:00', status: 'confirmed', queue: 'not-arrived', source: 'app' },
    // طلب حجز جديد من المريض الثاني عند موظف الاستقبال
    { id: 'b_r1', kind: 'doctor', providerId: 'u_doctor', patientId: 'u_patient2', patientName: ar('أحمد حسن', 'Ahmed Hassan'), phone: '01112223344', date: dayKey(2), time: '11:00', status: 'pending', queue: 'not-arrived', source: 'app', createdAt: ago(1) },
    // طابور اليوم عند د. أحمد سمير
    { id: 'b_q1', kind: 'doctor', providerId: 'u_doctor', patientId: 'u_patient2', patientName: ar('أحمد حسن', 'Ahmed Hassan'), phone: '01112223344', date: today, time: '09:00', status: 'done', queue: 'ended', source: 'reception' },
    { id: 'b_q2', kind: 'doctor', providerId: 'u_doctor', patientId: null, patientName: ar('فاطمة علي', 'Fatma Ali'), phone: '01123456789', date: today, time: '09:30', status: 'confirmed', queue: 'in-exam', source: 'reception' },
    { id: 'b_q3', kind: 'doctor', providerId: 'u_doctor', patientId: 'u_patient', patientName: ar('منى محمد', 'Mona Mohamed'), phone: '01012345678', date: today, time: '10:30', status: 'confirmed', queue: 'arrived', source: 'app' },
    { id: 'b_q4', kind: 'doctor', providerId: 'u_doctor', patientId: null, patientName: ar('محمود سعيد', 'Mahmoud Said'), phone: '01234567890', date: today, time: '11:00', status: 'confirmed', queue: 'not-arrived', source: 'reception' },
    { id: 'b_q5', kind: 'doctor', providerId: 'u_doctor', patientId: null, patientName: ar('نورا إبراهيم', 'Noura Ibrahim'), phone: '01098765432', date: today, time: '12:00', status: 'confirmed', queue: 'not-arrived', source: 'reception' },
    // د. سارة (بدون موظف استقبال)
    { id: 'b_s1', kind: 'doctor', providerId: 'u_doctor2', patientId: 'u_patient', patientName: ar('منى محمد', 'Mona Mohamed'), phone: '01012345678', date: today, time: '16:00', status: 'confirmed', queue: 'not-arrived', source: 'app' },
  ];
  const clinicPatients = {
    u_doctor: [
      { id: 'cp1', name: 'فاطمة علي', phone: '01123456789' },
      { id: 'cp2', name: 'محمود سعيد', phone: '01234567890' },
      { id: 'cp3', name: 'نورا إبراهيم', phone: '01098765432' },
    ],
  };

  // ---------------- الأطباء ----------------
  const doctors = {
    u_doctor: {
      professional: { license: 'EG-2014-58231', specialty: 'sp_internal', clinic: ar('عيادة الشفاء', 'Al-Shifa Clinic'), address: ar('١٢ شارع الجمهورية، المنصورة', '12 Al-Gomhoria St., Mansoura'), licenseFile: null },
      schedule: Array.from({ length: 7 }, (_, i) => ({ on: i < 5, from: '10:00', to: '17:00' })),
      team: [{ id: 't1', userId: 'u_reception', name: ar('أمل محروس', 'Amal Mahrous'), email: 'reception@shefaa.com', perms: [true, true, true] }],
      customTests: [],
    },
    u_doctor2: {
      professional: { license: 'EG-2016-30211', specialty: 'sp_cardio', clinic: ar('مركز القلب', 'Heart Center'), address: ar('٥ شارع النيل، المنصورة', '5 Nile St., Mansoura'), licenseFile: null },
      schedule: Array.from({ length: 7 }, (_, i) => ({ on: i < 4, from: '16:00', to: '21:00' })),
      team: [], customTests: [],
    },
  };

  // ---------------- المعامل ----------------
  const labs = {
    u_lab: {
      profile: {
        license: 'LB-2019-4471', address: ar('٢٥ شارع الجلاء، المنصورة', '25 Al-Galaa St., Mansoura'), phone: '0502345678',
        hours: [1, 1, 1, 1, 1, 1, 0].map((on) => ({ on: !!on, from: '08:00', to: '20:00' })),
        tests: [
          { name: 'HbA1c', on: true }, { name: 'صورة دم كاملة CBC', on: true }, { name: 'وظائف كلى', on: true }, { name: 'وظائف كبد', on: true },
          { name: 'أشعة سينية على الصدر', on: true }, { name: 'أشعة مقطعية على الصدر', on: true }, { name: 'موجات صوتية على البطن', on: true }, { name: 'رنين مغناطيسي', on: false },
        ],
      },
      requests: [
        { id: 1041, name: 'أحمد حسن', patientId: 'u_patient2', age: 45, sex: 'male', phone: '01112223344', test: 'HbA1c', kind: 'lab', doctor: dr1, status: 'new', createdAt: ago(3) },
        { id: 1042, name: 'فاطمة علي', patientId: null, age: 38, sex: 'female', phone: '01123456789', test: 'صورة دم كاملة CBC', kind: 'lab', doctor: dr2, status: 'new', createdAt: ago(2) },
        { id: 1040, name: 'محمود سعيد', patientId: null, age: 60, sex: 'male', phone: '01234567890', test: 'أشعة مقطعية على الصدر', kind: 'xray', doctor: dr2, status: 'progress', createdAt: ago(20) },
        { id: 1039, name: 'نورا إبراهيم', patientId: null, age: 29, sex: 'female', phone: '01098765432', test: 'موجات صوتية على البطن', kind: 'xray', doctor: ar('د. مها خالد', 'Dr. Maha Khaled'), status: 'progress', createdAt: ago(26) },
        { id: 1038, name: 'ياسر مصطفى', patientId: null, age: 51, sex: 'male', phone: '01556781234', test: 'وظائف كلى', kind: 'lab', doctor: dr1, status: 'done', createdAt: ago(50), files: ['kidney.pdf'], uploadedAt: ago(44), notes: '' },
        { id: 1037, name: 'هدى كمال', patientId: null, age: 52, sex: 'female', phone: '01011223344', test: 'أشعة سينية على الصدر', kind: 'xray', doctor: dr2, status: 'done', createdAt: ago(75), files: ['chest.dcm', 'chest.jpg'], uploadedAt: ago(70), notes: '' },
        { id: 1036, name: 'سامي فؤاد', patientId: null, age: 33, sex: 'male', phone: '01277788899', test: 'وظائف كبد', kind: 'lab', doctor: ar('د. مها خالد', 'Dr. Maha Khaled'), status: 'done', createdAt: ago(100), files: ['liver.pdf'], uploadedAt: ago(96), notes: '' },
        { id: 1035, name: 'منى عادل', patientId: null, age: 41, sex: 'female', phone: '01166655544', test: 'رنين مغناطيسي', kind: 'xray', doctor: dr1, status: 'done', createdAt: ago(130), files: ['mri.dcm'], uploadedAt: ago(121), notes: '' },
      ],
    },
  };

  // ---------------- الأدمن ----------------
  const licenses = [
    { id: 1, userId: null, name: ar('د. هبة نبيل', 'Dr. Heba Nabil'), type: 'dr', number: 'EG-2018-77120', by: 'syndicate', sentAt: ago(48), status: 'pend', reason: '' },
    { id: 2, userId: null, name: ar('مركز النور للتحاليل', 'Al-Noor Lab Center'), type: 'lab', number: 'LB-2021-3390', by: 'ministry', sentAt: ago(72), status: 'pend', reason: '' },
    { id: 3, userId: null, name: ar('د. كريم عادل', 'Dr. Karim Adel'), type: 'dr', number: 'EG-2020-45018', by: 'syndicate', sentAt: ago(3), status: 'pend', reason: '' },
    { id: 4, userId: 'u_doctor', name: ar('د. أحمد سمير', 'Dr. Ahmed Samir'), type: 'dr', number: 'EG-2014-58231', by: 'syndicate', sentAt: ago(400), status: 'ok', reason: '' },
    { id: 5, userId: 'u_lab', name: ar('معمل الأمل', 'Al-Amal Lab'), type: 'lab', number: 'LB-2019-4471', by: 'ministry', sentAt: ago(500), status: 'ok', reason: '' },
    { id: 6, userId: null, name: ar('د. وليد فؤاد', 'Dr. Walid Fouad'), type: 'dr', number: 'EG-2012-00000', by: 'syndicate', sentAt: ago(700), status: 'no', reason: ar('رقم الترخيص غير مطابق', 'License number does not match') },
  ];
  // حسابات إضافية تظهر في صفحة إدارة الحسابات فقط
  const extraAccounts = [
    { id: 'x_1', name: ar('نورا إبراهيم', 'Noura Ibrahim'), email: 'noura@example.com', role: 'patient', status: 'disabled' },
    { id: 'x_2', name: ar('د. مها خالد', 'Dr. Maha Khaled'), email: 'dr.maha@clinic.com', role: 'doctor', status: 'disabled' },
    { id: 'x_3', name: ar('سلمى أحمد', 'Salma Ahmed'), email: 'salma@clinic.com', role: 'reception', status: 'active' },
  ];
  const monitoring = {
    online: 248, latency: 180, errors: 0.3, uptime: 99.9,
    report: { booked: 3420, access: 1890, uploaded: 2710, newAccounts: 312 },
    services: [{ key: 'api', ok: true }, { key: 'db', ok: true }, { key: 'notif', ok: true }, { key: 'files', ok: true }, { key: 'ai', ok: false }],
    weekly: [820, 910, 880, 1040, 990, 760, 700], // السبت → الجمعة
  };

  // ---------------- دليل الأطباء والمعامل (للبحث والحجز) ----------------
  const places = [
    { id: 'u_doctor', type: 'doctor', name: ar('د. أحمد سمير', 'Dr. Ahmed Samir'), specialty: ar('باطنة وسكر', 'Internal medicine & diabetes'), address: ar('١٢ شارع الجمهورية', '12 Al-Gomhoria St.'), city: ar('المنصورة', 'Mansoura'), rating: 4.9, x: 56, y: 42, availableDays: [0, 1, 2, 3, 4, 6], timeSlots: ['10:00', '10:30', '11:00', '16:00', '16:30', '17:00'] },
    { id: 'u_doctor2', type: 'doctor', name: ar('د. سارة علي', 'Dr. Sara Ali'), specialty: ar('قلب وأوعية دموية', 'Cardiology'), address: ar('٥ شارع النيل', '5 Nile St.'), city: ar('المنصورة', 'Mansoura'), rating: 4.8, x: 30, y: 60, availableDays: [0, 1, 2, 3], timeSlots: ['16:00', '17:00', '18:00', '19:00'] },
    { id: 'pl_3', type: 'doctor', name: ar('د. مها خالد', 'Dr. Maha Khaled'), specialty: ar('مخ وأعصاب', 'Neurology'), address: ar('٨ شارع الجيش', '8 Al-Geish St.'), city: ar('طنطا', 'Tanta'), rating: 4.7, x: 72, y: 30, availableDays: [1, 2, 4, 6], timeSlots: ['12:00', '12:30', '13:00'] },
    { id: 'pl_4', type: 'doctor', name: ar('د. هبة نبيل', 'Dr. Heba Nabil'), specialty: ar('أطفال', 'Pediatrics'), address: ar('٣ شارع المحطة', '3 Station St.'), city: ar('القاهرة', 'Cairo'), rating: 4.6, x: 20, y: 28, availableDays: [0, 1, 2, 3, 4], timeSlots: ['09:00', '09:30', '10:00'] },
    { id: 'u_lab', type: 'lab', name: ar('معمل الأمل', 'Al-Amal Lab'), specialty: ar('تحاليل وأشعة', 'Lab tests & imaging'), address: ar('٢٥ شارع الجلاء', '25 Al-Galaa St.'), city: ar('المنصورة', 'Mansoura'), rating: 4.9, x: 44, y: 70, availableDays: [0, 1, 2, 3, 4, 5], timeSlots: ['08:00', '09:00', '10:00', '11:00'] },
    { id: 'pl_6', type: 'lab', name: ar('مركز النور للتحاليل', 'Al-Noor Lab Center'), specialty: ar('تحاليل وأشعة', 'Lab tests & imaging'), address: ar('١٠ شارع البحر', '10 Al-Bahr St.'), city: ar('طنطا', 'Tanta'), rating: 4.5, x: 80, y: 62, availableDays: [0, 1, 2, 3, 4, 6], timeSlots: ['08:00', '09:00', '10:00'] },
  ];

  return { v: SEED_VERSION, users, patients, doctors, labs, bookings, clinicPatients, licenses, extraAccounts, monitoring, places, sessions: {}, resets: {}, contacts: [] };
}
