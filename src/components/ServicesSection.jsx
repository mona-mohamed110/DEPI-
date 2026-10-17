
import { Bot, MapPin, FileText, FlaskConical, ShieldCheck } from "lucide-react";
import "./ServicesSection.css";

function ServicesSection() {
  return (
    <section className="services-section" dir="rtl">
      <div className="services-container">
        
        <h2 className="services-title">
          أبرز <span>الخدمات</span> التي نقدمها
        </h2>

        <p className="services-subtitle">
          تهدف منصة شفاء إلى تسهيل وصولك إلى الخدمات الصحية في مكان واحد، بأمان وبساطة وفي أي وقت.
        </p>

        <div className="services-grid">
           <article className="services-card services-card--narrow">
             <span className="services-card__icon">
                 <Bot size={22} />
             </span>
             <h3 className="services-card__title">مساعد ذكي لاختيار التخصص</h3>
             <p className="services-card__text">
                اكتب ما تشعر به وسيقترح عليك المساعد التخصص المناسب والأطباء المتاحين، دون تشخيص طبي.
            </p>
          </article>

          <article className="services-card services-card--wide">
            <span className="services-card__icon">
              <MapPin size={22} />
            </span>
            <h3 className="services-card__title">البحث عن الأطباء على الخريطة</h3>
            <p className="services-card__text">
              اعثر على الأطباء والمعامل ومراكز الأشعة الأقرب إليك بسهولة من خلال الخريطة التفاعلية.
            </p>
          </article>

          <article className="services-card">
            <span className="services-card__icon">
              <FileText size={22} />
            </span>
            <h3 className="services-card__title">السجل الطبي الإلكتروني</h3>
            <p className="services-card__text">
              احتفظ بسجلك الطبي في مكان واحد، وتحكم في من يمكنه الاطلاع عليه.
            </p>
          </article>

          <article className="services-card">
            <span className="services-card__icon">
              <FlaskConical size={22} />
            </span>
            <h3 className="services-card__title">نتائج التحاليل والأشعة</h3>
            <p className="services-card__text">
              استلم نتائج التحاليل والأشعة إلكترونيًا من المعامل ومراكز الأشعة.
            </p>
          </article>

          <article className="services-card">
            <span className="services-card__icon">
              <ShieldCheck size={22} />
            </span>
            <h3 className="services-card__title">حماية وخصوصية بياناتك</h3>
            <p className="services-card__text">
              بياناتك مشفّرة ومحمية، وصلاحيات الوصول تُحدَّد حسب دور كل مستخدم.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
