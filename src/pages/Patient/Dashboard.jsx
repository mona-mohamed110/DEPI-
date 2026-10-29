import { 
  LuCalendarDays, 
  LuPill, 
  LuLock, 
  LuTestTube 
} from 'react-icons/lu';
import './dashboard.css';

const MainDashboard = () => {
  return (
    <div className="dashboard-wrapper" dir="rtl">
      <header className="dashboard-header">
        <div className="header-greeting">
          <h1 className="greeting-title">
            أهلاً يا منى <span className="hand-emoji">👋</span>
          </h1>
          <p className="greeting-subtitle">ده ملخص حالتك الصحية النهاردة</p>
        </div>
        <div className="user-avatar-badge">م</div>
      </header>

      <div className="dashboard-grid">
        
        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper calendar-icon">
              <LuCalendarDays />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">أقرب موعد</span>
            <h2 className="card-main-value">بكرة ١٠:٣٠ ص</h2>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper medicine-icon">
              <LuPill />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">أدوية حالية</span>
            <h2 className="card-main-value">٣ أدوية</h2>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-top-row">
            <div className="icon-wrapper lock-icon">
              <LuLock />
            </div>
          </div>
          <div className="card-bottom-content">
            <span className="card-label">طلبات إذن معلقة</span>
            <h2 className="card-main-value">٣ طلبات</h2>
          </div>
        </div>

        <div className="card detail-card">
          <h3 className="section-title">المواعيد القادمة</h3>
          <div className="appointments-container">
            
            <div className="appointment-row">
              <div className="doc-avatar-circle">أ</div>
              <div className="doc-meta">
                <h4 className="doc-name">د. أحمد سمير</h4>
                <p className="doc-sub">باطنة · بكرة ١٠:٣٠ ص</p>
              </div>
              <span className="status-tag status-confirmed">مؤكد</span>
            </div>

            <div className="appointment-divider"></div>

            <div className="appointment-row">
              <div className="doc-avatar-circle">س</div>
              <div className="doc-meta">
                <h4 className="doc-name">د. سارة علي</h4>
                <p className="doc-sub">قلب · الأحد ٤:٠٠ م</p>
              </div>
              <span className="status-tag status-pending">قيد التأكيد</span>
            </div>

          </div>
        </div>

        <div className="card detail-card">
          <h3 className="section-title">تنبيهات</h3>
          <div className="alerts-container">
            
            

            <div className="alert-row">
              <LuTestTube className="react-alert-icon lab-icon" />
              <span className="alert-text">نتيجة تحليل السكر الصائم جاهزة</span>
            </div>

            <div className="alert-divider"></div>

            <div className="alert-row">
              <LuLock className="react-alert-icon lock-alert-icon" />
              <span className="alert-text">معمل الأمل طلب الوصول لملفك</span>
            </div>

          </div>
        </div>

        <div className="card detail-card prescription-card">
          <h3 className="section-title">آخر روشتة</h3>
          
          <div className="prescription-content">
            <div className="prescription-meta">
              <h4 className="prescription-doc">د. أحمد سمير</h4>
              <span className="prescription-date">٢٠ أكتوبر ٢٠٢٦</span>
            </div>
            <button className="btn-show" type="button">عرض</button>
          </div>

          <div className="prescription-footer-divider"></div>

          <p className="prescription-meds">
            ٣ أدوية · ميتفورمين، أملوديبين، فيتامين د
          </p>
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;