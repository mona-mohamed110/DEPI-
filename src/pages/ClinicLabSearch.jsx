import React, { useMemo, useRef, useState } from "react";
import "../components/Style/ClinicLabSearch.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const C = {
  primary: "#1aa3f0",
  primaryDark: "#0b84d6",
  primaryLight: "#e8f5ff",
  bg: "#f4faff",
  border: "#bfe3fb",
  text: "#1b2a3a",
  muted: "#7b8794",
  green: "#22c55e",
  red: "#ef4444",
  gold: "#fbbf24",
};

const PLACES = [
  { id: 1, type: "clinic", name: "د. سارة جونسون", specialty: "قلب وأوعية دموية", address: "شارع الجمهورية، المنيا", x: 34, y: 38, rating: 4.9, reviews: 212, open: true, hours: "9:00 ص - 9:00 م", phone: "0861234567", price: 300 },
  { id: 2, type: "clinic", name: "د. مارك لي", specialty: "جلدية", address: "كورنيش النيل، المنيا", x: 58, y: 28, rating: 4.8, reviews: 164, open: true, hours: "10:00 ص - 8:00 م", phone: "0867654321", price: 250 },
  { id: 3, type: "lab", name: "معمل الأمل للتحاليل", specialty: "تحاليل طبية", address: "شارع بن خصيب، المنيا", x: 45, y: 58, rating: 4.7, reviews: 98, open: true, hours: "7:00 ص - 11:00 م", phone: "0861112223", price: 0 },
  { id: 4, type: "lab", name: "مركز النيل للأشعة", specialty: "أشعة ومسح ضوئي", address: "ش المحافظة، المنيا", x: 70, y: 52, rating: 4.6, reviews: 131, open: false, hours: "8:00 ص - 6:00 م", phone: "0869998887", price: 0 },
  { id: 5, type: "clinic", name: "د. أحمد منصور", specialty: "باطنة وسكر", address: "شارع كورنيش الغرب", x: 22, y: 64, rating: 4.5, reviews: 77, open: true, hours: "4:00 م - 11:00 م", phone: "0864445556", price: 200 },
  { id: 6, type: "clinic", name: "د. ليلى حسن", specialty: "نساء وتوليد", address: "حي الشرق، المنيا", x: 80, y: 74, rating: 4.9, reviews: 305, open: true, hours: "12:00 م - 10:00 م", phone: "0863332221", price: 350 },
  { id: 7, type: "lab", name: "معمل البرج", specialty: "تحاليل ومزارع", address: "ش الحرية، المنيا", x: 62, y: 80, rating: 4.4, reviews: 54, open: false, hours: "8:00 ص - 4:00 م", phone: "0862221110", price: 0 },
  { id: 8, type: "clinic", name: "د. عمر فتحي", specialty: "عظام", address: "شارع السوق، المنيا", x: 14, y: 30, rating: 4.7, reviews: 143, open: true, hours: "2:00 م - 10:00 م", phone: "0868889990", price: 280 },
];

const SPECIALTIES = ["الكل", "قلب وأوعية دموية", "جلدية", "باطنة وسكر", "نساء وتوليد", "عظام", "تحاليل طبية", "أشعة ومسح ضوئي"];

/* ------------------------------ أيقونات ------------------------------ */
const Star = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={C.gold}>
    <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" />
  </svg>
);

const Pin = ({ type, active }) => {
  const color = type === "lab" ? "#8b5cf6" : C.primary;
  const s = active ? 1.25 : 1;
  return (
    <svg width={36 * s} height={46 * s} viewBox="0 0 36 46">
      <path d="M18 45C18 45 3 28 3 17a15 15 0 0130 0c0 11-15 28-15 28z" fill={color} stroke="#fff" strokeWidth="2.5" />
      <circle cx="18" cy="17" r="9" fill="#fff" />
      {type === "lab" ? (
        <path d="M15 11h6v3l3 6a2 2 0 01-2 3h-8a2 2 0 01-2-3l3-6z" fill={color} />
      ) : (
        <path d="M16.5 11h3v3.5H23v3h-3.5V21h-3v-3.5H13v-3h3.5z" fill={color} />
      )}
    </svg>
  );
};

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <svg width="34" height="34" viewBox="0 0 40 40">
      <circle cx="16" cy="16" r="12" fill="#43bdfa" />
      <circle cx="26" cy="26" r="12" fill="#0b84d6" opacity=".85" />
    </svg>
    <span style={{ fontWeight: 800, fontSize: 20, color: C.primaryDark }}>Smart Healthcare Ledger</span>
  </div>
);

/* ------------------------------ الخريطة ------------------------------ */
function MapView({ places, selectedId, onSelect }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const box = useRef(null);
  const selected = places.find((p) => p.id === selectedId);

  const zoom = (d) =>
    setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.8, +(v.scale + d).toFixed(2))) }));

  const down = (e) => {
    if (e.target.closest(".hs-pin,.hs-zoom,.hs-popup")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    setView((v) => ({
      ...v,
      x: drag.current.ox + (e.clientX - drag.current.sx),
      y: drag.current.oy + (e.clientY - drag.current.sy),
    }));
  };
  const up = () => (drag.current = null);

  return (
    <div
      ref={box}
      className="hs-card"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onWheel={(e) => zoom(e.deltaY < 0 ? 0.1 : -0.1)}
      style={{ position: "relative", height: 620, overflow: "hidden", cursor: drag.current ? "grabbing" : "grab", touchAction: "none", background: "#eaf5fd" }}
    >
      {/* طبقة الخريطة القابلة للتحريك والتكبير */}
      <div
        style={{
          position: "absolute", inset: 0,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: "50% 50%",
          transition: drag.current ? "none" : "transform .15s",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <rect width="100" height="100" fill="#f1f8fd" />
          {/* مساحات خضراء */}
          <rect x="4" y="44" width="14" height="10" rx="2" fill="#d7f0df" />
          <rect x="74" y="8" width="18" height="12" rx="2" fill="#d7f0df" />
          <rect x="48" y="86" width="20" height="9" rx="2" fill="#d7f0df" />
          {/* النيل */}
          <path d="M-5 78 C 20 68, 30 90, 52 76 S 85 58, 105 66 L105 80 C 85 72, 70 90, 52 90 S 20 80, -5 92 Z" fill="#a9d9f7" />
          {/* شوارع رئيسية */}
          <g stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round">
            <path d="M0 22 L100 30" /><path d="M0 48 L100 44" /><path d="M0 66 L100 58" />
            <path d="M28 0 L36 100" /><path d="M54 0 L50 100" /><path d="M78 0 L84 100" />
          </g>
          <g stroke="#dcecf8" strokeWidth=".7" fill="none">
            <path d="M0 10 L100 14" /><path d="M0 36 L100 38" /><path d="M10 0 L16 100" /><path d="M66 0 L68 100" /><path d="M92 0 L96 100" />
          </g>
        </svg>

        {/* الدبابيس */}
        {places.map((p) => (
          <button
            key={p.id}
            className="hs-pin"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              zIndex: p.id === selectedId ? 20 : 5,
              transform: `translate(-50%,-100%) scale(${1 / view.scale})`,
              transformOrigin: "50% 100%",
            }}
            onClick={() => onSelect(p.id)}
            aria-label={p.name}
          >
            {p.id === selectedId && (
              <span style={{ position: "absolute", left: "50%", bottom: 0, width: 30, height: 30, marginLeft: -15, marginBottom: -10, borderRadius: "50%", background: C.primary, animation: "hsPulse 1.4s infinite" }} />
            )}
            <span style={{ position: "relative", display: "block" }}>
              <Pin type={p.type} active={p.id === selectedId} />
            </span>
          </button>
        ))}

        {/* موقعي */}
        <div style={{ position: "absolute", left: "48%", top: "46%", transform: `translate(-50%,-50%) scale(${1 / view.scale})` }}>
          <span style={{ display: "block", width: 18, height: 18, borderRadius: "50%", background: "#2563eb", border: "3px solid #fff", boxShadow: "0 0 0 8px rgba(37,99,235,.2)" }} />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div style={{ position: "absolute", top: 14, left: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="hs-zoom" onClick={() => zoom(0.25)}>+</button>
        <button className="hs-zoom" onClick={() => zoom(-0.25)}>−</button>
        <button className="hs-zoom" title="إعادة الضبط" onClick={() => setView({ scale: 1, x: 0, y: 0 })} style={{ fontSize: 16 }}>◎</button>
      </div>

      {/* دليل الألوان */}
      <div style={{ position: "absolute", top: 14, right: 14, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "8px 14px", display: "flex", gap: 14, fontSize: 12, fontWeight: 600 }}>
        <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: C.primary, marginLeft: 6 }} />عيادة</span>
        <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#8b5cf6", marginLeft: 6 }} />معمل / أشعة</span>
      </div>

      {/* بطاقة المكان المختار */}
      {selected && (
        <div className="hs-popup hs-card" style={{ position: "absolute", bottom: 16, right: 16, left: 16, maxWidth: 420, margin: "0 auto", padding: 16, cursor: "default" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{selected.name}</div>
              <div style={{ color: C.primaryDark, fontSize: 13, fontWeight: 600 }}>{selected.specialty}</div>
            </div>
            <button onClick={() => onSelect(null)} style={{ border: 0, background: "none", fontSize: 18, cursor: "pointer", color: C.muted }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: C.muted, margin: "8px 0" }}>📍 {selected.address} &nbsp;•&nbsp; 🕒 {selected.hours}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="hs-btn" style={{ flex: 1, padding: "10px 12px", fontSize: 13 }}>
              {selected.type === "lab" ? "عرض الفحوصات" : "احجز موعد"}
            </button>
            <button className="hs-chip" style={{ padding: "10px 16px" }}>الملف الشخصي</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ الصفحة ------------------------------ */
export default function ClinicLabSearch() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [specialty, setSpecialty] = useState("الكل");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState("rating");
  const [selectedId, setSelectedId] = useState(null);

  const results = useMemo(() => {
    let list = PLACES.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (specialty !== "الكل" && p.specialty !== specialty) return false;
      if (openOnly && !p.open) return false;
      const q = query.trim();
      if (q && !(`${p.name} ${p.specialty} ${p.address}`).includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => (sort === "rating" ? b.rating - a.rating : b.reviews - a.reviews));
    return list;
  }, [query, type, specialty, openOnly, sort]);

  return (
    <div className="hs-root">
      {/* الشريط العلوي */}
<Navbar />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 24px 60px" }}>
        {/* العنوان */}
        <section style={{ textAlign: "center", margin: "20px 0 30px" }}>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: 0 }}>
            ابحث عن <span style={{ color: C.primary }}>عيادة</span> أو <span style={{ color: C.primary }}>معمل</span> قريب منك
          </h1>
          <p style={{ color: C.muted, maxWidth: 560, margin: "12px auto 0", fontSize: 14, lineHeight: 1.9 }}>
            استعرض الأطباء والمعامل ومراكز الأشعة على الخريطة، وقارن بين التقييمات والمواعيد، ثم احجز مباشرة بخطوات بسيطة.
          </p>
        </section>

        {/* صندوق البحث */}
        <section className="hs-card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700 }}>
            ابحث بسهولة في <span style={{ color: C.primary }}>3 خطوات</span>
          </h2>

          <div className="hs-filters" style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1.2fr auto", gap: 14, alignItems: "end" }}>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.primaryDark }}>🔍 الاسم أو التخصص أو المنطقة</div>
              <input className="hs-input" placeholder="مثال: قلب، معمل الأمل..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.primaryDark }}>🩺 التخصص</div>
              <select className="hs-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.primaryDark }}>↕ ترتيب حسب</div>
              <select className="hs-input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rating">الأعلى تقييماً</option>
                <option value="reviews">الأكثر مراجعات</option>
              </select>
            </label>
            <button className="hs-btn" onClick={() => setSelectedId(results[0]?.id ?? null)}>بحث ✓</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, alignItems: "center" }}>
            {[["all", "الكل"], ["clinic", "عيادات"], ["lab", "معامل وأشعة"]].map(([v, l]) => (
              <button key={v} className={`hs-chip ${type === v ? "on" : ""}`} onClick={() => setType(v)}>{l}</button>
            ))}
            <label style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} style={{ accentColor: C.primary, width: 16, height: 16 }} />
              المفتوح الآن فقط
            </label>
          </div>
        </section>

        {/* النتائج + الخريطة */}
        <section className="hs-grid" style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, alignItems: "start" }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>
              النتائج <span style={{ color: C.primary }}>({results.length})</span>
            </div>
            <div className="hs-scroll" style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 590, overflowY: "auto", padding: "4px 4px 4px 8px" }}>
              {results.length === 0 && (
                <div className="hs-card" style={{ padding: 30, textAlign: "center", color: C.muted }}>لا توجد نتائج مطابقة، جرّب تغيير البحث.</div>
              )}
              {results.map((p) => (
                <div key={p.id} className={`hs-item ${p.id === selectedId ? "sel" : ""}`} onClick={() => setSelectedId(p.id)}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", background: p.type === "lab" ? "#ede9fe" : C.primaryLight, fontSize: 24 }}>
                    {p.type === "lab" ? "🧪" : "🩺"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, height: "fit-content", whiteSpace: "nowrap", background: p.open ? "#dcfce7" : "#fee2e2", color: p.open ? "#15803d" : "#b91c1c" }}>
                        {p.open ? "مفتوح" : "مغلق"}
                      </span>
                    </div>
                    <div style={{ color: C.primaryDark, fontSize: 13, fontWeight: 600 }}>{p.specialty}</div>
                    <div style={{ color: C.muted, fontSize: 12, margin: "4px 0" }}>📍 {p.address}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700 }}>
                        <Star /> {p.rating} <span style={{ color: C.muted, fontWeight: 400 }}>({p.reviews})</span>
                      </span>
                      {p.price > 0 && <span style={{ fontSize: 12, color: C.muted }}>الكشف: <b style={{ color: C.text }}>{p.price} ج.م</b></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MapView places={results} selectedId={selectedId} onSelect={setSelectedId} />
        </section>
      </main>
      <Footer /> 
    </div>
  
  );
}
