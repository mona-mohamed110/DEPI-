import { useState } from "react";
import { FaUser, FaEnvelope, FaArrowCircleRight } from "react-icons/fa";
import "./style/HelpDesk.css";
import ContactModal from "./ContactModal";



export default function HelpDesk() {
  const [form, setForm] = useState({ firstName: "", email: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form); // هنا تبعت البيانات للـ API
    setForm({ firstName: "", email: "" });
  };
const [isOpen, setIsOpen] = useState(false);
  return (
    <section className="helpdesk">
      <h2 className="helpdesk-title">
        الوصول <span className="gradient-text">إلى</span> الدعم
      </h2>
      <p className="helpdesk-subtitle">أسئلة ؟ بحاجة الى مساعدة ؟<br></br> فريق الدعم المخصص لدينا هنا لمساعدتك في كل خطوة</p>

      <form className="helpdesk-form" onSubmit={handleSubmit}>

        <button
  type="button"
  className="btn-contact"
  onClick={function () { setIsOpen(true); }}
>
  تواصل معنا <FaArrowCircleRight />
</button>

      </form>
      <ContactModal isOpen={isOpen} onClose={function () { setIsOpen(false); }} />
    </section>
  );
}
