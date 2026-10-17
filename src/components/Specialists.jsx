import { FaPhoneAlt } from "react-icons/fa";
import "./style/Specialists.css";
import doc1 from "../assets/doc1.png"
import doc2 from "../assets/doc2.png"


const doctors = [
  {
    id: 1,
    name: "د. سارة جونسون",
    specialty: "أخصائية القلب",
    image: doc1,
    text: "صحة القلب هي شغف د. سارة، ونهجها في طب القلب يجمع بين أحدث التقنيات والرعاية الرحيمة. هي صوت موثوق في الوقاية من أمراض القلب، وشريك يعتمد عليه مرضاها في رحلتهم نحو العافية.",
    dots: "top",
  },
  {
    id: 2,
    name: "د. مارك لي",
    specialty: "أخصائي الجلدية",
    image: doc2,
    text: "د. لي صاحب رؤية في طب الجلدية، يطوّر علاجات صحة البشرة بأسلوب لطيف وشامل. التزامه بالتميز السريري وتثقيف المرضى جعله من رواد رعاية الجلد، ويُعرف بدقته وحرصه على الرعاية التي تضع المريض أولًا.",
    dots: "bottom",
  },
];

export default function Specialists() {
  return (
    <section className="specialists" dir="rtl">
      <h2 className="section-title">
        <span className="gradient-text">أساتذة الطب:</span>
        <br />
        تعرّف على فريق أخصائيينا
      </h2>
      <p className="section-subtitle">
        فريق أخصائيينا في طليعة الابتكار الطبي. يقدّم كل أخصائي مزيجًا فريدًا من
        الخبرة والتعاطف والتجربة، ليضمن أن صحتك في أيدٍ أمينة.
      </p>

      <div className="doctors-list">
        {doctors.map((doc) => (
          <article className="doctor-card" key={doc.id}>
            <span className={`dots dots--${doc.dots}`} aria-hidden="true" />
            <img className="doctor-img" src={doc.image} alt={doc.name} />

            <div className="doctor-info">
              <h3>
                {doc.name} ({doc.specialty})
              </h3>
              <p>{doc.text}</p>
              <button type="button" className="btn-book">
                احجز موعدًا <FaPhoneAlt />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
