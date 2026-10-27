import { useState } from "react";
import { FaArrowCircleRight } from "react-icons/fa";
import "./style/HelpDesk.css";
import ContactModal from "./ContactModal";

export default function HelpDesk() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="helpdesk">
      <h2 className="helpdesk-title">
        الوصول <span className="gradient-text">إلى</span> الدعم
      </h2>
      <p className="helpdesk-subtitle">
        أسئلة ؟ بحاجة الى مساعدة ؟<br />
        فريق الدعم المخصص لدينا هنا لمساعدتك في كل خطوة
      </p>

      <div className="helpdesk-form">
        <button
          type="button"
          className="btn-contact"
          onClick={function () { setIsOpen(true); }}
        >
          تواصل معنا <FaArrowCircleRight />
        </button>
      </div>

      <ContactModal isOpen={isOpen} onClose={function () { setIsOpen(false); }} />
    </section>
  );
}