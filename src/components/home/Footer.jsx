import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import "../Style/Footer.css";
import logo from "../../assets/logo.png";

const columns = [
  {
    title: "الدعم",
    links: ["البدء السريع", "الأسئلة الشائعة", "مقالات المساعدة", "الإبلاغ عن مشكلة", "التواصل مع مكتب المساعدة"],
  },
  {
    title: "الخدمات",
    links: ["حجز المواعيد", "الاستشارات عبر الإنترنت", "الوصفات الطبية", "تجديد الأدوية", "الملاحظات الطبية"],
  },
  {
    title: "قانوني",
    links: ["الشروط والأحكام", "سياسة الخصوصية", "إشعار ملفات تعريف الارتباط", "تفضيلات ملفات الارتباط", "مركز الثقة"],
  },
];

const socials = [
  { icon: <FaFacebook />, label: "فيسبوك", href: "https://www.facebook.com/" },
  { icon: <FaInstagram />, label: "إنستجرام", href: "https://www.instagram.com/" },
  { icon: <FaLinkedin />, label: "لينكدإن", href: "https://www.linkedin.com/" },
  { icon: <FaYoutube />, label: "يوتيوب", href: "https://www.youtube.com/" },
];

function Logo() {
  return (
    <div className="footer-logo" aria-label="SHEFAA">
        <img src={logo} alt="img" />
        <div className="footer-socials">
          {socials.map((s) => (
            <a key={s.label} href={s.href} aria-label={s.label} target="_blank">
              {s.icon}
            </a>
          ))}
        </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer" dir="rtl">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo />
        </div>

        <nav className="footer-columns" aria-label="روابط التذييل">
          {columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy"> جميع الحقوق محفوظه &copy; شفاء 2026</span>
      </div>
    </footer>
  );
}
