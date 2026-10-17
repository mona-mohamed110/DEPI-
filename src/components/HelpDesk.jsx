import { useState } from "react";
import { FaUser, FaEnvelope, FaArrowCircleRight } from "react-icons/fa";
import "./style/HelpDesk.css";



export default function HelpDesk() {
  const [form, setForm] = useState({ firstName: "", email: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form); // هنا تبعت البيانات للـ API
    setForm({ firstName: "", email: "" });
  };

  return (
    <section className="helpdesk">
      <h2 className="helpdesk-title">
        الوصول <span className="gradient-text">إلى</span> الدعم
      </h2>
      <p className="helpdesk-subtitle">أسئلة ؟ بحاجة الى مساعدة ؟<br></br> فريق الدعم المخصص لدينا هنا لمساعدتك في كل خطوة</p>

      <form className="helpdesk-form" onSubmit={handleSubmit}>
        <label className="field">
          <FaUser className="field-icon" />
          <input
            type="text"
            name="firstName"
            placeholder="الاسم"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          <FaEnvelope className="field-icon" />
          <input
            type="email"
            name="email"
            placeholder="البريد الالكتروني"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="btn-contact">
          تواصل معنا <FaArrowCircleRight />
        </button>
      </form>
    </section>
  );
}
