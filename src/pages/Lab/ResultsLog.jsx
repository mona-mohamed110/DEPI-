import { useEffect, useState } from "react";
import DayPicker from "./DayPicker.jsx";
import { useLab } from "./LabContext.jsx";
import * as api from "../../api/lab.js";
const { fileType, openResultFile } = api;
import Icon from "../../components/Icon.jsx";

/* ---------- الصفحة ---------- */
export default function ResultsLog() {
  const { t, testName, requests, fmtDateTime, toast, day, setDay } = useLab();
  const open = (q, i) => openResultFile(q, i).catch(() => toast(t("error")));
  const [name, setName] = useState("");
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState([]);

  // الأيام المحفوظة في الداتا (الأيام اللي فيها نتايج بس هي اللي تتفعل في التقويم)
  useEffect(() => { api.getResultDates().then(setDates).catch(() => {}); }, [requests]);

  // الفلترة بالاسم واليوم عن طريق الـ API
  useEffect(() => {
    let off = false;
    const h = setTimeout(() => {
      api.getResults({ name, date: day }).then((r) => !off && setRows(r)).catch(() => toast(t("error")));
    }, 250);
    return () => { off = true; clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, day, requests]);

  return (
    <section>
      <h1>{t("logTitle")}</h1>
      <p className="sub">{t("logSub")}</p>
      <div className="card">
        <div className="filters">
          <div className="search">
            <Icon name="search" size={18} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("searchPh")} />
          </div>
          <DayPicker value={day} dates={dates} onChange={setDay} />
        </div>
        <div className="scroll">
          <table>
            <thead><tr>
              <th>{t("orderNo")}</th><th>{t("patient")}</th><th>{t("exam")}</th><th>{t("resultCol")}</th><th>{t("filesCol")}</th><th>{t("uploadDate")}</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={6} className="sub">{t("noResults")}</td></tr> : rows.map((q) => (
                <tr key={q.id}>
                  <td>#{q.id}</td><td><b>{q.name}</b></td><td>{testName(q.test)}</td>
                  <td>
                    <span className={`badge ${!q.resultStatus || q.resultStatus === "normal" ? "ok" : q.resultStatus === "high" ? "dg" : "wn"}`}>{t(`rs_${q.resultStatus || "normal"}`)}</span>
                    <div className="sub" style={{ margin: "6px 0 0", maxWidth: 260, whiteSpace: "pre-wrap" }}>{q.notes || t("noNotes")}</div>
                  </td>
                  <td>{(q.files || []).map((f, i) => (
                    <button type="button" key={i} className="btn s o" style={{ margin: "2px" }} title={f} onClick={() => open(q, i)}>
                      <Icon name="file" size={14} />{fileType(f)} {i + 1}
                    </button>
                  ))}</td>
                  <td>{fmtDateTime(q.uploadedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
