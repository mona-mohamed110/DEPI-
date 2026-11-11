import { useNavigate, useParams } from "react-router-dom";
import { useLab } from "./LabContext.jsx";
import Icon from "../../components/Icon.jsx";

const STATUS = { new: { k: "stNew", c: "wn" }, progress: { k: "stProg", c: "" }, done: { k: "stDone", c: "ok" } };

export default function RequestDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, L, lang, testName, requests, startRequest, fmtDateTime, loading } = useLab();
  const q = requests.find((r) => String(r.id) === id) || (!id ? requests[0] : null);
  const st = q && STATUS[q.status];

  return (
    <section>
      <h1>{t("detTitle")}</h1>
      <p className="sub">{t("detSub")}</p>
      <div className="card" style={{ marginBottom: 16 }}>
        <select value={q?.id ?? ""} onChange={(e) => nav(`/lab/details/${e.target.value}`)} aria-label={t("pickRequest")}>
          {!q && <option value="">{loading ? t("loading") : t("noRequests")}</option>}
          {requests.map((r) => <option key={r.id} value={r.id}>#{r.id} · {r.name} · {testName(r.test)}</option>)}
        </select>
      </div>

      {q && (
        <>
          <div className="note"><Icon name="lock" size={18} /><span>{t("noteSecurity")}</span></div>
          <div className="grid g2">
            <div className="card">
              <h2>{t("reqTest")}</h2>
              <div className="row">
                <div className="ty"><Icon name={q.kind === "xray" ? "scan" : "tube"} size={22} /></div>
                <div className="m"><b>{testName(q.test)}</b><small>{t("reqNo", { id: q.id })}</small></div>
                <span className={`badge ${st.c}`}>{t(st.k)}</span>
              </div>
              <div className="row"><span className="m">{t("doctor")}</span><b>{L(q.doctor) || t("walkIn")}</b></div>
              <div className="row"><span className="m">{t("reqTime")}</span><b>{fmtDateTime(q.createdAt)}</b></div>
            </div>
            <div className="card">
              <h2>{t("patientData")}</h2>
              <div className="row"><span className="m">{t("name")}</span><b>{q.name}</b></div>
              <div className="row"><span className="m">{t("age")}</span><b>{t("years", { n: q.age })}</b></div>
              <div className="row"><span className="m">{t("sex")}</span><b>{t(q.sex)}</b></div>
              <div className="row"><span className="m">{t("phone")}</span><b dir="ltr">{q.phone}</b></div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {q.status === "new" && <button type="button" className="btn" onClick={() => startRequest(q.id)}>{t("start")}</button>}
            {q.status === "progress" && <button type="button" className="btn" onClick={() => nav(`/lab/upload/${q.id}`)}>{t("uploadArrow")}<Icon name={lang === "ar" ? "arrowL" : "arrowR"} size={18} /></button>}
            {q.status === "done" && <span className="badge ok"><Icon name="checkc" size={14} />{t("resultUploaded")}</span>}
          </div>
        </>
      )}
    </section>
  );
}
