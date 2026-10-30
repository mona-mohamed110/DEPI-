import { useState } from "react";
import "../../components/Style/Admin/Licenses.css";

function Licenses() {
  const [licenses, setLicenses] = useState([
    { id: 1, name: "د. هبة نبيل", type: "طبيب", number: "EG-2018-77120", by: "نقابة الأطباء", date: "منذ يومين", status: "pend", reason: "" },
    { id: 2, name: "مركز النور للتحاليل", type: "معمل", number: "LB-2021-3390", by: "وزارة الصحة", date: "منذ ٣ أيام", status: "pend", reason: "" },
    { id: 3, name: "د. كريم عادل", type: "طبيب", number: "EG-2020-45018", by: "نقابة الأطباء", date: "اليوم", status: "pend", reason: "" },
    { id: 4, name: "د. أحمد سمير", type: "طبيب", number: "EG-2014-58231", by: "نقابة الأطباء", date: "١٠ أكتوبر", status: "ok", reason: "" },
    { id: 5, name: "معمل الأمل", type: "معمل", number: "LB-2019-4471", by: "وزارة الصحة", date: "٥ أكتوبر", status: "ok", reason: "" },
    { id: 6, name: "د. وليد فؤاد", type: "طبيب", number: "EG-2012-00000", by: "نقابة الأطباء", date: "٢٨ سبتمبر", status: "no", reason: "رقم الترخيص غير مطابق" },
  ]);
  const [tab, setTab] = useState("pend");
  const [viewLicense, setViewLicense] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveId, setApproveId] = useState(null);
const [toast, setToast] = useState("");

function showToast(text) {
  setToast(text);
  setTimeout(function () {
    setToast("");
  }, 2200);
}

  function approve(id) {
    const newList = licenses.map(function (l) {
      if (l.id === id) {
        return { ...l, status: "ok" };
      }
      return l;
    });
    setLicenses(newList);
    setApproveId(null);
showToast("تم اعتماد الترخيص ✅");
  }

  function confirmReject() {
    if (rejectReason.trim() === "") {
      return;
    }
    const newList = licenses.map(function (l) {
      if (l.id === rejectId) {
        return { ...l, status: "no", reason: rejectReason };
      }
      return l;
    });
    setLicenses(newList);
    setRejectId(null);
    setRejectReason("");
    showToast("تم رفض الطلب وإبلاغ صاحبه");
  }

  function countByStatus(s) {
    return licenses.filter(function (l) {
      return l.status === s;
    }).length;
  }

  const filtered = licenses.filter(function (l) {
    return l.status === tab;
  });

  return (
    <div className="licenses" dir="rtl">
      <h1>التحقق من التراخيص</h1>
      <p className="licenses-sub">مراجعة تراخيص الأطباء والمعامل قبل اعتمادها</p>

      <div className="licenses-tabs">
        <button className={tab === "pend" ? "on" : ""} onClick={() => setTab("pend")}>
          قيد المراجعة ({countByStatus("pend")})
        </button>
        <button className={tab === "ok" ? "on" : ""} onClick={() => setTab("ok")}>
          معتمد ({countByStatus("ok")})
        </button>
        <button className={tab === "no" ? "on" : ""} onClick={() => setTab("no")}>
          مرفوض ({countByStatus("no")})
        </button>
      </div>

      <div className="licenses-card">
        {filtered.map(function (l) {
          return (
            <div className="licenses-row" key={l.id}>
              <div className="licenses-avatar">{l.name.replace("د. ", "").charAt(0)}</div>

              <div className="licenses-info">
                <div>
                  <b>{l.name}</b>
                  <span className="licenses-badge">{l.type}</span>
                </div>
                <small>
                  رقم الترخيص: <span dir="ltr">{l.number}</span> · الجهة: {l.by} · تم الإرسال {l.date}
                </small>
                <button className="licenses-file" onClick={() => setViewLicense(l)}>
                  📄 عرض صورة الترخيص
                </button>
                {l.reason && <span className="licenses-badge stop">{l.reason}</span>}
              </div>

              {l.status === "pend" && (
                <div className="licenses-actions">
                  <button className="licenses-btn" onClick={() => setApproveId(l.id)}>اعتماد</button>
                  <button className="licenses-btn outline" onClick={() => setRejectId(l.id)}>رفض</button>
                </div>
              )}
              {l.status === "ok" && <span className="licenses-badge ok">معتمد ✔</span>}
              {l.status === "no" && <span className="licenses-badge stop">مرفوض</span>}
            </div>
          );
        })}

        {filtered.length === 0 && <p>مفيش طلبات هنا</p>}
      </div>

      {viewLicense && (
        <div className="licenses-overlay" onClick={() => setViewLicense(null)}>
          <div className="licenses-modal" onClick={(e) => e.stopPropagation()}>
            <h2>ترخيص {viewLicense.name}</h2>
            <div className="licenses-preview">
              {/* هنا نحط صورة الترخيص الحقيقية بعدين: <img src={viewLicense.image} /> */}
              📄 معاينة الترخيص
            </div>
            <p dir="ltr">{viewLicense.number}</p>
            <button className="licenses-btn" onClick={() => setViewLicense(null)}>إغلاق</button>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="licenses-overlay" onClick={() => setRejectId(null)}>
          <div className="licenses-modal" onClick={(e) => e.stopPropagation()}>
            <h2>سبب الرفض</h2>
            <textarea
              className="licenses-textarea"
              placeholder="اكتبي سبب رفض الترخيص..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="licenses-actions">
              <button className="licenses-btn danger" onClick={confirmReject}>تأكيد الرفض</button>
              <button className="licenses-btn outline" onClick={() => setRejectId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {approveId && (
  <div className="admin-overlay" onClick={() => setApproveId(null)}>
    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
      <h2>اعتماد الترخيص</h2>
      <p>هل راجعتي المستند وأنتِ متأكدة من الاعتماد؟</p>
      <div className="admin-modal-actions">
        <button className="licenses-btn" onClick={() => approve(approveId)}>نعم، اعتماد</button>
        <button className="licenses-btn outline" onClick={() => setApproveId(null)}>إلغاء</button>
      </div>
    </div>
  </div>
)}

{toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Licenses;