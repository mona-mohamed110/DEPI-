import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLab } from "../../context/LabContext";
import Icon from "../../components/Lab/Icon";

const STATUS = { new: { k: "stNew", c: "wn" }, progress: { k: "stProg", c: "" }, done: { k: "stDone", c: "ok" } };
const FILTERS = [["all", "fAll"], ["new", "fNew"], ["progress", "fProg"], ["done", "fDone"]];

export default function LabDashboard() {
  const { t, num, requests, counts, loading, startRequest, fmtDateTime } = useLab();
  const nav = useNavigate();
  const [f, setF] = useState("all");
  const list = useMemo(() => requests.filter((r) => f === "all" || r.status === f), [requests, f]);

  const stats = [
    { k: "statNew", v: counts.new, icon: "inbox", tone: "wn" },
    { k: "statProg", v: counts.progress, icon: "clock", tone: "pr" },
    { k: "statDone", v: counts.done, icon: "checkc", tone: "ok" },
    { k: "statTotal", v: counts.total, icon: "layers", tone: "mu" },
  ];

  return (
    <section>
      <h1>{t("incoming")}</h1>
      <p className="lb-sub">{t("incomingSub")}</p>

      <div className="lb-grid lb-g4">
        {stats.map((s) => (
          <div className="lb-card lb-stat" key={s.k}>
            <div className={`lb-tile ${s.tone}`}><Icon name={s.icon} size={22} /></div>
            <span>{t(s.k)}</span>
            <b>{num(s.v)}</b>
          </div>
        ))}
      </div>

      <div className="lb-card" style={{ marginTop: 16 }}>
        <div className="lb-tabs">
          {FILTERS.map(([v, k]) => (
            <button key={v} type="button" className={f === v ? "on" : ""} onClick={() => setF(v)}>{t(k)}</button>
          ))}
        </div>

        {loading ? <p className="lb-sub">{t("loading")}</p> : list.length === 0 ? <p className="lb-sub">{t("noRequests")}</p> : list.map((r) => {
          const st = STATUS[r.status];
          return (
            <div className="lb-row" key={r.id}>
              <div className="lb-ty">{r.kind === "xray" ? "🩻" : "🧪"}</div>
              <div className="lb-m">
                <b>{r.name}</b>
                <small>{r.test} · {fmtDateTime(r.createdAt)}</small>
              </div>
              <span className={`lb-badge ${st.c}`}>{t(st.k)}</span>
              {r.status === "new" && <button type="button" className="lb-btn lb-s" onClick={() => startRequest(r.id)}>{t("start")}</button>}
              {r.status === "progress" && <button type="button" className="lb-btn lb-s" onClick={() => nav(`/lab/upload/${r.id}`)}>{t("uploadBtn")}</button>}
              <button type="button" className="lb-btn lb-o lb-s" onClick={() => nav(`/lab/details/${r.id}`)}>{t("details")}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
