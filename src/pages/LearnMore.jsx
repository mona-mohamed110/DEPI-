import "./LearnMore.css";
import { Link } from "react-router";

function LearnMore() {
  return (
    <div className="learn-more-page" dir="rtl">
      <div className="learn-more-container">
        <h1 className="learn-more-heading">
          عن منصة <span>شفاء</span>
        </h1>
        
        <p className="learn-more-lead">
          نحن نؤمن بأن الرعاية الصحية يجب أن تكون في متناول الجميع، سهلة، وآمنة تماماً.
        </p>

        <div className="learn-more-grid">
          <div className="learn-more-card">
            <h3>رؤيتنا</h3>
            <p>
              بناء منظومة صحية رقمية متكاملة تربط المريض بكافة مقدمي الخدمات الطبية (أطباء، معامل  ) لضمان تجربة علاجية سلسة.
            </p>
          </div>

          <div className="learn-more-card">
            <h3>خصوصيتك وأمان بياناتك</h3>
            <p>
              نستخدم أحدث تقنيات التشفير لحفظ سجلاتك الطبية، مع إعطائك الصلاحية الكاملة للتحكم في من يمكنه الاطلاع على ملفك الطبي.
            </p>
          </div>

          <div className="learn-more-card">
            <h3>لماذا تختار شفاء؟</h3>
            <p>
              توفير الوقت والجهد في حجز المواعيد، الوصول السريع للتقارير والتحاليل الطبية، ومتابعة المستجدات الصحية في مكان واحد بكل سهولة.
            </p>
          </div>
        </div>

        <div className="back-home-wrapper">       
          <Link to="/">
            <button className="back-home-btn">
              العودة إلى الرئيسية
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LearnMore;