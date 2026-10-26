import aboutImage from "../assets/about-team.png";
import "./style/AboutSection.css";
import { Link } from "react-router-dom";

function AboutSection() {
  return (
    <section id="about" className="about-section" dir="rtl">
      <div className="about-box">
        <h2 className="about-title">
          عن <span>شفاء:</span> تعرّف على منصتنا
        </h2>

        <div className="about-content">
          <div className="about-text">
            <p>
              شفاء منصة طبية إلكترونية تجمع المرضى والأطباء والمعامل ومراكز
              الأشعة في مكان واحد. نهدف إلى تسهيل الوصول إلى الرعاية الصحية،
              وحفظ بياناتك الطبية بأمان، مع إبقاء التحكم في مشاركتها بين يديك.
            </p>

            <Link to="/learn-more" className="about-button">
  اعرف المزيد عن شفاء
</Link>
          </div>

          <div className="about-image-wrapper">
            <img

              className="about-image"
              src={aboutImage}
              alt="فريق طبي من الأطباء والممرضين"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
