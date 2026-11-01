import { 
  LuCalendarDays, 
  LuPill, 
  LuLock, 
  LuTestTube 
} from 'react-icons/lu';
import { useApp } from '../../context/AppContext.jsx';
import '../../components/Style/Patient/dashboard.css';

const translations = {
  ar: {
    greeting: "أهلاً يا منى",
    subtitle: "ده ملخص حالتك الصحية النهاردة",
    userInitial: "م",
    nextAppointment: "أقرب موعد",
    nextAppointmentVal: "بكرة ١٠:٣٠ ص",
    currentMeds: "أدوية حالية",
    currentMedsVal: "٣ أدوية",
    pendingRequests: "طلبات إذن معلقة",
    pendingRequestsVal: "٣ طلبات",
    upcomingAppts: "المواعيد القادمة",
    doc1Name: "د. أحمد سمير",
    doc1Sub: "باطنة · بكرة ١٠:٣٠ ص",
    statusConfirmed: "مؤكد",
    doc2Name: "د. سارة علي",
    doc2Sub: "قلب · الأحد ٤:٠٠ م",
    statusPending: "قيد التأكيد",
    alerts: "تنبيهات",
    alert1: "نتيجة تحليل السكر الصائم جاهزة",
    alert2: "معمل الأمل طلب الوصول لملفك",
    latestPrescription: "آخر روشتة",
    showBtn: "عرض",
    prescriptionMeds: "٣ أدوية · ميتفورمين، أملوديبين، فيتامين د",
    prescriptionDate: "٢٠ أكتوبر ٢٠٢٦"
  },
  en: {
    greeting: "Welcome, Mona",
    subtitle: "Here is your health summary today",
    userInitial: "M",
    nextAppointment: "Next Appointment",
    nextAppointmentVal: "Tomorrow 10:30 AM",
    currentMeds: "Current Medications",
    currentMedsVal: "3 Medications",
    pendingRequests: "Pending Requests",
    pendingRequestsVal: "3 Requests",
    upcomingAppts: "Upcoming Appointments",
    doc1Name: "Dr. Ahmed Samir",
    doc1Sub: "Internal Med · Tomorrow 10:30 AM",
    statusConfirmed: "Confirmed",
    doc2Name: "Dr. Sara Ali",
    doc2Sub: "Cardiology · Sun 4:00 PM",
    statusPending: "Pending",
    alerts: "Alerts",
    alert1: "Fasting blood sugar test result is ready",
    alert2: "Al-Amal Lab requested access to your profile",
    latestPrescription: "Latest Prescription",
    showBtn: "View",
    prescriptionMeds: "3 Meds · Metformin, Amlodipine, Vitamin D",
    prescriptionDate: "Oct 20, 2026"
  }
};

const MainDashboard = () => {
  const app = useApp() || {};
  
  const currentLang = app.lang || app.language || 'ar';
  const isArabic = currentLang === 'ar' || currentLang === 'AR';
  const currentTheme = app.theme || (app.isDark || app.darkMode ? 'dark' : 'light');

  const t = translations[isArabic ? 'ar' : 'en'];

  return (
    <div className={`dashboard-wrapper ${currentTheme}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="dashboard-header">
        <div className="header-greeting">
          <h1 className="greeting-title">
            {t.greeting} <span className="hand-emoji">👋</span>
          </h1>
          <p className="greeting-subtitle">{t.subtitle}</p>
        </div>
        <div className="user-avatar-badge">{t.userInitial}</div>
      </header>

      <div className="dashboard-grid">
        
        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper calendar-icon">
              <LuCalendarDays />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">{t.nextAppointment}</span>
            <h2 className="card-main-value">{t.nextAppointmentVal}</h2>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper medicine-icon">
              <LuPill />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">{t.currentMeds}</span>
            <h2 className="card-main-value">{t.currentMedsVal}</h2>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper lock-icon">
              <LuLock />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">{t.pendingRequests}</span>
            <h2 className="card-main-value">{t.pendingRequestsVal}</h2>
          </div>
        </div>

        <div className="card detail-card">
          <h3 className="section-title">{t.upcomingAppts}</h3>
          <div className="appointments-container">
            
            <div className="appointment-row">
              <div className="doc-avatar-circle">{isArabic ? 'أ' : 'A'}</div>
              <div className="doc-meta">
                <h4 className="doc-name">{t.doc1Name}</h4>
                <p className="doc-sub">{t.doc1Sub}</p>
              </div>
              <span className="status-tag status-confirmed">{t.statusConfirmed}</span>
            </div>

            <div className="appointment-divider"></div>

            <div className="appointment-row">
              <div className="doc-avatar-circle">{isArabic ? 'س' : 'S'}</div>
              <div className="doc-meta">
                <h4 className="doc-name">{t.doc2Name}</h4>
                <p className="doc-sub">{t.doc2Sub}</p>
              </div>
              <span className="status-tag status-pending">{t.statusPending}</span>
            </div>

          </div>
        </div>

        <div className="card detail-card">
          <h3 className="section-title">{t.alerts}</h3>
          <div className="alerts-container">
            
            <div className="alert-row">
              <LuTestTube className="react-alert-icon lab-icon" />
              <span className="alert-text">{t.alert1}</span>
            </div>

            <div className="alert-divider"></div>

            <div className="alert-row">
              <LuLock className="react-alert-icon lock-alert-icon" />
              <span className="alert-text">{t.alert2}</span>
            </div>

          </div>
        </div>

        <div className="card detail-card prescription-card">
          <h3 className="section-title">{t.latestPrescription}</h3>
          
          <div className="prescription-content">
            <div className="prescription-meta">
              <h4 className="prescription-doc">{t.doc1Name}</h4>
              <span className="prescription-date">{t.prescriptionDate}</span>
            </div>
            <button className="btn-show" type="button">{t.showBtn}</button>
          </div>

          <div className="prescription-footer-divider"></div>

          <p className="prescription-meds">
            {t.prescriptionMeds}
          </p>
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;