import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLab } from "./LabContext.jsx";
import Icon from "../../components/Icon.jsx";

const STATUS = { new: { k: "stNew", c: "wn" }, progress: { k: "stProg", c: "" }, done: { k: "stDone", c: "ok" } };
const FILTERS = [["all", "fAll"], ["new", "fNew"], ["progress", "fProg"], ["done", "fDone"]];

export default function LabDashboard() {
  const { t, testName, num, requests, counts, loading, startRequest, fmtDateTime } = useLab();
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
      <p className="sub">{t("incomingSub")}</p>

      <div className="grid g4">
        {stats.map((s) => (
          <div className="card stat" key={s.k}>
            <div className={`tile ${s.tone}`}><Icon name={s.icon} size={22} /></div>
            <span>{t(s.k)}</span>
            <b>{num(s.v)}</b>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="tabs">
          {FILTERS.map(([v, k]) => (
            <button key={v} type="button" className={f === v ? "on" : ""} onClick={() => setF(v)}>{t(k)}</button>
          ))}
        </div>

        {loading ? <p className="sub">{t("loading")}</p> : list.length === 0 ? <p className="sub">{t("noRequests")}</p> : list.map((r) => {
          const st = STATUS[r.status];
          return (
            <div className="row" key={r.id}>
              <div className="ty"><Icon name={r.kind === "xray" ? "scan" : "tube"} size={22} /></div>
              <div className="m">
                <b>{r.name}</b>
                <small>{testName(r.test)} · {fmtDateTime(r.createdAt)}</small>
              </div>
              <span className={`badge ${st.c}`}>{t(st.k)}</span>
              {r.status === "new" && <button type="button" className="btn s" onClick={() => startRequest(r.id)}>{t("start")}</button>}
              {r.status === "progress" && <button type="button" className="btn s" onClick={() => nav(`/lab/upload/${r.id}`)}>{t("uploadBtn")}</button>}
              <button type="button" className="btn o s" onClick={() => nav(`/lab/details/${r.id}`)}>{t("details")}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
