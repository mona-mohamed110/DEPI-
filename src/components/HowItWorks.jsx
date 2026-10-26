
import doc1 from "../assets/274ee88b4ba090887500f714810fb576dab7b349.png"
import doc2 from "../assets/e2a5b7fb191c4fe5f86a038fa314f7425339cd7d.png"
import doc3 from "../assets/998812e9dc462bbde9dab5699a17e50fd8f50dda.png"
import doc4 from "../assets/4eaea67a8370b78ad225c6d11ccacd4e1b7de8f5.png"
import doc5 from "../assets/fa0c789d121f218650c955cb43aa5eb4666ffa9d.png"
import "./Style/HowItWorks.css";
import { useEffect, useRef, useState } from "react";


const STEPS = [
    {
        title: "أنشئ ملفك الشخصي",
        text: "أنشئ حسابك وأكمل ملفك الشخصي وسجلك الطبي بأمان. احتفظ بمعلوماتك الصحية الأساسية منظمة ومحدّثة باستمرار.",
    },
    {
        title: "اختر الخدمة المناسبة",
        text: "تعرّف على خدمات الرعاية الصحية المتاحة، وأدر سجلاتك الطبية، واختر الخدمة التي تناسب احتياجاتك.",
    },
    {
        title: "تواصل مع طبيبك",
        text: "تواصل مع أحد المتخصصين للحصول على استشارة عن بُعد أو زيارة مباشرة، وتابع خطوات رعايتك الصحية من مكان واحد.",
    },
];

const TESTIMONIALS = [
    {
        img: doc2,
        quote: "«بعد جراحة الركبة، ساعدني تنظيم معلوماتي الصحية على متابعة فترة التعافي بسهولة أكبر.»",
        name: "ليندا",
    },
    {
        img: doc3,
        quote: "«أصبحت متابعة رعايتي المستمرة وأدويتي أسهل بكثير وأقل إرهاقًا.»",
        name: "هنري",
    },
];
const STATS = [
    { count: 10000, suffix: "+", label: "استشارة ناجحة" },
    { count: 2500, suffix: "+", label: "متخصص في الرعاية الصحية" },
    { count: 98, suffix: "%", label: "معدل رضا المرضى" },
    { count: 200, suffix: "+", label: "أخصائي متميز" },
];
const TESTIMONIALSa = [
    {
        img: doc4,
        quote: "«جمع معلوماتي الصحية في مكان واحد يوفر الوقت ويسهّل الاستعداد للمواعيد الطبية.»",
        name: "جوشوا",
    },
    {
        img: doc5,
        quote: "«أصبحت أشعر بثقة أكبر ووعي أفضل عندما أتابع رحلتي الصحية بصورة واضحة.»",
        name: "سامانثا",
    },
];



const DOCTOR_IMG =
    doc1;


const formatNumber = (value) => new Intl.NumberFormat("ar-EG").format(value);

function StatNumber({ count, suffix }) {
    const ref = useRef(null);
    const [text, setText] = useState(`${count.toLocaleString("en-US")}${suffix}`);

    useEffect(() => {
        const element = ref.current;
        if (!element || !("IntersectionObserver" in window)) return;

        let frameId;
        const animate = () => {
            const duration = 1100;
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setText(formatNumber(Math.round(count * eased)) + suffix);
                if (progress < 1) frameId = requestAnimationFrame(tick);
            };
            frameId = requestAnimationFrame(tick);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate();
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.45 }
        );
        observer.observe(element);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frameId);
        };
    }, [count, suffix]);

    return (
        <div className="stat-number" ref={ref}>
            {text}
        </div>
    );
}


function HowItWorks1() {
    return (
        <section className="section how-it-works" aria-labelledby="how-title">
            <div className="section-heading">
                <h1 id="how-title">
                    كيف <span className="gradient-text">تعمل</span> منصتنا
                </h1>
                <p>
                    أصبحت رحلتك في الرعاية الصحية أكثر سهولة مع السجل الذكي للرعاية الصحية.
                    اتبع الخطوات التالية للبدء والاستفادة من خدمات المنصة.
                </p>
            </div>

            <div className="how-grid">
                <div className="steps">
                    {STEPS.map((step, i) => (
                        <article className="step" key={step.title}>
                            <div className="step-number">{i + 1}</div>
                            <div>
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <div
                    className="doctor-area"
                    aria-label="صورة توضيحية لأحد المتخصصين في الرعاية الصحية"
                >
                    <div className="doctor-frame"></div>
                    <img
                        className="doctor-photo"
                        src={DOCTOR_IMG}
                        alt="طبيب يرتدي معطفًا أبيض"
                        loading="lazy"
                    />
                    <div className="medical-cross" aria-hidden="true">✚</div>
                    <div className="certified">
                        <span className="star">★</span>
                        <span>متخصصون موثوقون في الرعاية الصحية</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Testimonials() {
    return (
        <section className="section testimonials" aria-labelledby="testimonials-title">
            <div className="dots dots-left" aria-hidden="true"></div>
            <div className="dots dots-right" aria-hidden="true"></div>

            <div className="section-heading">
                <h2 id="testimonials-title">
                    <span className="gradient-text">آراء المرضى:</span>
                    <br />
                    استمع إلى تجارب من تلقوا رعايتنا
                </h2>
                <p>اكتشف كيف يمكن للرعاية الصحية المتكاملة والمدروسة أن تُحدث فرقًا في حياتك اليومية.</p>
            </div>

            <div className="testimonial-grid">
                {TESTIMONIALS.map((t) => (
                    <article className="testimonial-card" key={t.name}>
                        <img className="avatar" src={t.img} alt="صورة أحد المرضى" loading="lazy" />
                        <p className="quote">
                            {t.quote}
                            <br />
                            <strong>– {t.name}</strong>
                        </p>
                    </article>
                ))}
            </div>


            <div className="stats" aria-label="إحصائيات المنصة">
                {STATS.map((s) => (
                    <div key={s.label}>
                        <StatNumber count={s.count} suffix={s.suffix} />
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="testimonial-grid">
                {TESTIMONIALSa.map((t) => (
                    <article className="testimonial-card" key={t.name}>
                        <img className="avatar" src={t.img} alt="صورة أحد المرضى" loading="lazy" />
                        <p className="quote">
                            {t.quote}
                            <br />
                            <strong>– {t.name}</strong>
                        </p>
                    </article>
                ))}
            </div>

        </section>
    );
}


function HowItWorks() {
    return (
        <section id="how-it-works" className="how-it-works">
            <main className="page">
                <HowItWorks1 />
                <Testimonials />

            </main>
        </section>
    );
}

export default HowItWorks;