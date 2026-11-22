# تشغيل الـ Backend (MongoDB)

1. `cd backend && npm install`
2. انسخ `.env.example` إلى `.env` وعدّل `MONGO_URI` و `JWT_SECRET` و`EMAIL_USER`/`EMAIL_PASS` لإرسال أكواد استعادة كلمة المرور.
3. `node createAdmin.js EMAIL PASSWORD` لإنشاء مدير، و`node createLab.js EMAIL PASSWORD` لإنشاء حساب معمل.
4. `node index.js` (المنفذ 5000).
5. في جذر المشروع، ملف `.env` للواجهة:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_USE_MOCK=false
   ```

## ما أُضيف
| Endpoint | الوظيفة |
|---|---|
| GET/PUT `/api/doctor/schedule` | مواعيد عمل الطبيب (`User.schedule`) |
| GET/PUT `/api/lab/profile` | بيانات المعمل وساعاته وتحاليله (`User.labProfile`) |
| GET/PUT `/api/patient/profile` | تاريخ الميلاد، الدم، الطول، الوزن، الأمراض المزمنة (`User.profile`) |
| POST `/api/patient/triage` | فرز أعراض بالكلمات المفتاحية |
| POST `/api/public/contact` | رسائل التواصل (مجموعة `contactmessages`) مع حد 5 رسائل/ساعة لكل IP |

وأُصلح تكرار تركيب `/api/patient` و`/api/lab` في `index.js`، وصار المنفذ من `PORT`.
لا حاجة لـ migration: الحقول الجديدة اختيارية وتأخذ قيماً افتراضية عند القراءة.
