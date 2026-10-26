import "./style/Hero.css";
import Group1 from "../assets/Group 1.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faLocationDot } from '@fortawesome/free-solid-svg-icons';


function HeroSection() {
  return (
    <section id="home" className="hero-section-wrapper" dir="rtl">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            شريكك <span className="highlight-blue">الخبير والمسؤول</span> <br />
            في الرعاية الصحية الرقمية.
          </h1>

          <p className="hero-description">
            <strong>نعزز صحتك في كل خطوة.</strong> استمتع برعاية طبية مخصصة من راحة بيتك. تواصل مع <span className="bold-blue">أطباء معتمدين</span>، وقم بإدارة وصفاتك الطبية، وحجز مواعيدك بسهولة. هل أنت مستعد للتحكم في صحتك؟ <span className="bold-blue">ابدأ الآن</span> أو احجز موعداً اليوم.
          </p>

          <button className="cta-button">
            احجز موعداً الآن <span className="arrow">←</span>
          </button>

          <div className="trusted-by">
            <div className="brand-logos">
              <i className="fab fa-amazon"></i>
              <i className="fab fa-apple"></i>
              <i className="fab fa-google"></i>
              <i className="fas fa-sticky-note"></i>
              <i className="fab fa-spotify"></i>
              <i className="fab fa-slack"></i>
            </div>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="doctor-bg-circle"></div>

          <img src={Group1} alt="طبيب" className="doctor-image" />

          <svg className="dotted-line" viewBox="0 0 500 500">
            <path
              d="M 50,250 C 100,100 400,100 450,250 C 500,400 100,450 50,250"
              fill="none"
              stroke="#93C5FD"
              strokeWidth="3"
              strokeDasharray="8,8"
            />
          </svg>

          <div className="floating-card booking-card">
            <span className="star-icon">★</span>
            <span>حجز موعد بكل سهولة</span>
          </div>

          <div className="floating-card customers-card">
            <div className="card-top">
              <div className="avatar-group">
                <img src="https://i.pravatar.cc/100?img=33" alt="مستخدم" />
                <img src="https://i.pravatar.cc/100?img=12" alt="مستخدم" />
                <img src="https://i.pravatar.cc/100?img=60" alt="مستخدم" />
                <img src="https://i.pravatar.cc/100?img=47" alt="مستخدم" />
              </div>
              <span className="customer-count">+2400</span>
            </div>
            <p className="card-title">عملاء سعداء</p>
            <div className="stars">
              ★★★★★ <span className="rating-text">(4.7 تقييم)</span>
            </div>
          </div>

          <div className="floating-card quote-card">
            <div className="quote-icon">“</div>
            <p>
              تجربة ممتازة وسريعة للغاية، تمكنت من التواصل مع الطبيب وحجز الموعد في دقائق معدودة.
            </p>
          </div>
        </div>
      </div>

      <div className="search-section-center">
        <div className="hero-search-bar">
          <div className="search-field">
            <span className="field-icon">
              <FontAwesomeIcon icon={faStethoscope} style={{ color: "rgb(13, 13, 13)" }} />
            </span>
            <select defaultValue="">
              <option value="" disabled>التخصص</option>
              <option value="cardio">أمراض القلب</option>
              <option value="dental">أسنان</option>
              <option value="pediatrics">أطفال</option>
              <option value="derma">جلدية</option>
            </select>
          </div>

          <div className="search-divider"></div>

          <div className="search-field">
            <span className="field-icon">
              <FontAwesomeIcon icon={faLocationDot} style={{ color: "rgb(13, 13, 13)" }} />
            </span>
            <input type="text" placeholder="المدينة أو المنطقة" />
          </div>

          <button className="search-submit-btn">
            <span>ابحث</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;