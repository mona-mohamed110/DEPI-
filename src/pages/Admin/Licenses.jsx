import { useState } from "react";
import { useApp } from "../../context/AppContext.jsx";
import "../../components/Style/Admin/Licenses.css";

function Licenses() {
  const { t } = useApp();

  const [licenses, setLicenses] = useState([
    { id: 1, name: "د. هبة نبيل", type: "dr", number: "EG-2018-77120", by: "syndicate", date: "منذ يومين", status: "pend", reason: "" },
    { id: 2, name: "مركز النور للتحاليل", type: "lab", number: "LB-2021-3390", by: "ministry", date: "منذ ٣ أيام", status: "pend", reason: "" },
    { id: 3, name: "د. كريم عادل", type: "dr", number: "EG-2020-45018", by: "syndicate", date: "اليوم", status: "pend", reason: "" },
    { id: 4, name: "د. أحمد سمير", type: "dr", number: "EG-2014-58231", by: "syndicate", date: "١٠ أكتوبر", status: "ok", reason: "" },
    { id: 5, name: "معمل الأمل", type: "lab", number: "LB-2019-4471", by: "ministry", date: "٥ أكتوبر", status: "ok", reason: "" },
    { id: 6, name: "د. وليد فؤاد", type: "dr", number: "EG-2012-00000", by: "syndicate", date: "٢٨ سبتمبر", status: "no", reason: "رقم الترخيص غير مطابق" },
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
    showToast(t("adm_toast_approved"));
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
    showToast(t("adm_toast_rejected"));
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
    <div className="licenses">
      <h1>{t("adm_lic_title")}</h1>
      <p className="licenses-sub">{t("adm_lic_sub")}</p>

      <div className="licenses-tabs">
        <button className={tab === "pend" ? "on" : ""} onClick={() => setTab("pend")}>
          {t("adm_lic_pend")} ({countByStatus("pend")})
        </button>
        <button className={tab === "ok" ? "on" : ""} onClick={() => setTab("ok")}>
          {t("adm_lic_ok")} ({countByStatus("ok")})
        </button>
        <button className={tab === "no" ? "on" : ""} onClick={() => setTab("no")}>
          {t("adm_lic_no")} ({countByStatus("no")})
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
                  <span className="licenses-badge">{t("adm_type_" + l.type)}</span>
                </div>
                <small>
                  {t("adm_lic_number")}: <span dir="ltr">{l.number}</span> · {t("adm_lic_by")}: {t("adm_by_" + l.by)} · {t("adm_lic_sent")} {l.date}
                </small>
                <button className="licenses-file" onClick={() => setViewLicense(l)}>
                  📄 {t("adm_lic_view")}
                </button>
                {l.reason && <span className="licenses-badge stop">{l.reason}</span>}
              </div>

              {l.status === "pend" && (
                <div className="licenses-actions">
                  <button className="licenses-btn" onClick={() => setApproveId(l.id)}>{t("adm_lic_approve")}</button>
                  <button className="licenses-btn outline" onClick={() => setRejectId(l.id)}>{t("adm_lic_reject")}</button>
                </div>
              )}
              {l.status === "ok" && <span className="licenses-badge ok">{t("adm_lic_approved")}</span>}
              {l.status === "no" && <span className="licenses-badge stop">{t("adm_lic_rejected")}</span>}
            </div>
          );
        })}

        {filtered.length === 0 && <p>{t("adm_lic_empty")}</p>}
      </div>

      {viewLicense && (
        <div className="licenses-overlay" onClick={() => setViewLicense(null)}>
          <div className="licenses-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("adm_lic_license_of")} {viewLicense.name}</h2>
            <div className="licenses-preview">
              {/* هنا نحط صورة الترخيص الحقيقية بعدين: <img src={viewLicense.image} /> */}
              📄 {t("adm_lic_preview")}
            </div>
            <p dir="ltr">{viewLicense.number}</p>
            <button className="licenses-btn" onClick={() => setViewLicense(null)}>{t("adm_lic_close")}</button>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="licenses-overlay" onClick={() => setRejectId(null)}>
          <div className="licenses-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("adm_lic_reject_title")}</h2>
            <textarea
              className="licenses-textarea"
              placeholder={t("adm_lic_reject_ph")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="licenses-actions">
              <button className="licenses-btn danger" onClick={confirmReject}>{t("adm_lic_reject_yes")}</button>
              <button className="licenses-btn outline" onClick={() => setRejectId(null)}>{t("adm_cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {approveId && (
        <div className="admin-overlay" onClick={() => setApproveId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t("adm_lic_approve_title")}</h2>
            <p>{t("adm_lic_approve_ask")}</p>
            <div className="admin-modal-actions">
              <button className="licenses-btn" onClick={() => approve(approveId)}>{t("adm_lic_approve_yes")}</button>
              <button className="licenses-btn outline" onClick={() => setApproveId(null)}>{t("adm_cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

export default Licenses;