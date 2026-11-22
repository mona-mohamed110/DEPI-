# شفاء — Shefaa

منصة رعاية صحية (React + Vite): صفحة رئيسية، تسجيل دخول بالأدوار، ولوحات للمريض / الطبيب / المعمل / الاستقبال / الأدمن.

## التشغيل
```bash
npm install
npm run dev
```
بدون أي إعداد المشروع يشتغل على **بيانات وهمية** (`src/mock`). لما الـ Backend يجهز: انسخ `.env.example` إلى `.env` وحط `VITE_API_URL`.

## الحسابات التجريبية
| الدور | البريد | كلمة المرور |
|---|---|---|
| مريض | patient@shefaa.com | Patient@123 |
| مريض (داتا مختلفة) | patient2@shefaa.com | Patient@123 |
| طبيب | doctor@shefaa.com | Doctor@123 |
| معمل | lab@shefaa.com | Lab@12345 |
| استقبال | reception@shefaa.com | Reception@123 |
| أدمن | admin@shefaa.com | Admin@123 |

* أي حساب جديد من صفحة **التسجيل** يدخل على لوحته بداتا خاصة بيه: المريض بيسجل (تاريخ الميلاد، فصيلة الدم، الطول، الوزن، الأمراض المزمنة) وتظهر في ملفه الطبي، والطبيب/المعمل بيرفعوا الشهادة (صورة أو PDF) وبتظهر للأدمن مع طلب الترخيص.
* الطبيب والمعمل بيتسجل لهم طلب ترخيص يظهر عند الأدمن. لو عايز الدخول يتوقف لحد الاعتماد: `VITE_REQUIRE_LICENSE_APPROVAL=true`.
* **نسيت كلمة المرور:** الكود بيتبعت على الإيميل (في وضع التجربة الكود `123456` ويظهر في الصفحة).
* لتصفير الداتا الوهمية: افتح الـ console واكتب `resetMockDb()`.

## دورة الحجز والربط بين الأقسام
1. **المريض يحجز عند دكتور** ← يوصل **طلب حجز** لموظف الاستقبال التابع للدكتور ده (لو الدكتور معندوش موظف، الحجز بيتأكد تلقائياً).
2. **موظف الاستقبال يقبل الطلب** (من لوحته، وعليها عدّاد في السايدبار) ← المريض بيدخل طابور الدكتور، والدكتور بياخد **إذن اطلاع على ملف المريض 30 يوم** (يظهر في صفحة الأذونات عند المريض وعليه عدّاد، ويقدر يسحبه).
3. **الدكتور** بيشوف ملف المريض كامل (قراءة فقط) من `doctor/patient-file`، ويضيف **روشتة** (أدوية + جرعة + مدة) من `doctor/exam` بعد رسالة تأكيد "إرسال / تعديل" ← بتتضاف تلقائياً لروشتات المريض، والتحاليل بتروح للمعمل. **الروشتة والإذن الساري هما الرابط بين الدكتور والمريض** (من غير إذن ساري الـ API يرجّع 403).
4. **الدكتور يضيف موظف استقبال** (اسم + إيميل + كلمة سر) ← الحساب بيتربط بالدكتور ده فقط (`doctorId`) ويدخل كـ reception يدير حجوزاته هو بس.
5. **المريض يحجز عند معمل** (مع اختيار التحليل/الأشعة) ← الطلب بيوصل المعمل مباشرة، ولما المعمل يرفع النتيجة بتظهر عند المريض في صفحة النتائج وحالة الحجز بتتحدث.

## هيكل الملفات
```
src/
├─ config/        env.js (الإعدادات)  ·  catalog.js (أنواع التحاليل)
├─ api/           ← طبقة الـ API الوحيدة (كل الصفحات بتكلم السيرفر من هنا)
│   ├ http.js        عميل واحد: التوكن، المهلة، رفع الملفات، تحويل الأخطاء، التحويل للـ mock
│   ├ security.js    فحص الإيميل/الباسورد، تنظيف النصوص، الجلسة، حماية محاولات الدخول
│   └ auth / patient / doctor / lab / reception / admin / shared / public .js
├─ mock/          ← البيانات الوهمية (بتتشال لما تحط VITE_API_URL)
│   ├ seed.js        الداتا الوهمية + الحسابات التجريبية
│   ├ mockServer.js  بيحاكي السيرفر (جلسات + صلاحيات الأدوار) · routes/ = شكل الردود المتوقعة
│   └ egyptian-drugs.json
├─ context/       Prefs (اللغة والثيم للموقع كله) · Auth · I18n
├─ i18n/          ← ملف ترجمة لكل جزء: home, auth, patient, doctor, lab, reception, admin (+ common مشترك)
├─ styles/        ← theme.css (الوضع الداكن والألوان — ملف واحد للكل)
│                    home.css · auth.css · lab.css · patient.css · doctor.css · reception.css · admin.css
├─ components/    Icon.jsx (ملف الأيقونات الوحيد) · shell/ (سايدبار + قائمة الإعدادات مشتركة) · ui/ · home/ · auth/
└─ pages/         home · auth · patient · doctor · lab · reception · admin
```

## عقد الـ API (للـ Backend)
Base URL = `VITE_API_URL`. كل الردود JSON، والأخطاء بشكل `{ "code": "invalid_credentials", "message": "..." }`.
التوكن بيتبعت `Authorization: Bearer <token>` (أو cookies لو `VITE_API_CREDENTIALS=include`).

| المجموعة | Endpoints |
|---|---|
| Auth | `POST /auth/login` `/auth/register` (multipart مع الشهادة للدكتور/المعمل) `/auth/logout` `/auth/forgot-password` `/auth/verify-code` `/auth/reset-password` `/auth/change-password` · `GET /auth/me` |
| Account (كل الأدوار) | `GET/PUT /me` · `POST /me/logout-all` |
| Public | `GET /public/places` · `POST /public/contact` · `GET /drugs/all` |
| Patient | `/patient/dashboard` `profile` `medical-file` `history` (POST/PUT) `reports` `prescriptions` (+ PATCH current/past) `results` `triage` `appointments` (حجوزات) `permissions/{active,log}` |
| Doctor | `/doctor/dashboard` `patients` `patients/:id/file` `exams` `tests` `schedule` `professional` `license-file` `team` (name+email+password) |
| Lab | `/lab/requests` `requests/:id/start` `requests/:id/result` `results` `results/dates` `profile` |
| Reception | `/reception/requests` (+ `/:id/accept` `/:id/reject`) `queue` `queue/:id` `patients` `appointments` `records` |
| Admin | `/admin/monitoring` `licenses` `licenses/:id/approve\|reject` `accounts` `accounts/:id` |

شكل الردود بالتفصيل = الملفات في `src/mock/routes/*.js`، والدوال المقابلة في `src/api/*.js`.
الربط بين الأقسام (مثال: روشتة الطبيب تظهر عند المريض، وطلب التحليل يظهر عند المعمل، ونتيجة المعمل تظهر عند المريض) موجود في الـ mock كمرجع للمنطق المطلوب في الـ Backend.

## اللوجو
اللوجو بيتبدل تلقائياً مع الوضع الداكن عن طريق `src/components/BrandLogo.jsx`: `src/assets/logo.png` (الفاتح) و`src/assets/logo-darkMode.png` (الداكن). لتغيير الصورة استبدل الملفين بنفس الأسماء.

## الأمان
* **لازم يتكرر في السيرفر:** كل فحوصات الواجهة (الإيميل، قوة الباسورد، حجم/نوع الملف، الصلاحيات حسب الدور) لتحسين التجربة فقط.
* الجلسة في `sessionStorage` (بتتمسح بقفل التبويب) وتنتهي بعد 8 ساعات. **الأفضل في الإنتاج: httpOnly cookie** (`VITE_API_CREDENTIALS=include`).
* حراس المسارات (`RequireRole`) بيمنعوا الدخول على لوحة دور مختلف، والسيرفر لازم يطبق نفس القاعدة على كل endpoint (الـ mock بيعمل ده كمثال).
* تنظيف كل النصوص الخارجة (`cleanDeep`) · لا يوجد `dangerouslySetInnerHTML` · روابط الملفات بتتفحص (`safeUrl`) · مهلة للطلبات · حظر مؤقت بعد 5 محاولات دخول خاطئة (واجهة فقط، والسيرفر لازم يعمل rate-limit).
* رسالة "نسيت كلمة المرور" بترد بنفس الرد سواء الإيميل موجود أو لأ.
* حط في الـ Backend: CORS محدد، HTTPS، Rate limiting، تشفير الباسورد (bcrypt/argon2)، وCSP headers.
