import { Fragment, useEffect, useState } from "react";
import DayPicker from "./DayPicker.jsx";
import { useLab } from "./LabContext.jsx";
import * as api from "../../api/lab.js";
const { fileType, openResultFile } = api;
import Icon from "../../components/Icon.jsx";
import ConfirmForm from "../../components/ui/ConfirmForm.jsx";

/* ---------- الصفحة ---------- */
export default function ResultsLog() {
  const { t, testName, requests, fmtDateTime, toast, act, refresh, day, setDay } = useLab();
  const open = (q, i) => openResultFile(q, i).catch(() => toast(t("error")));
  const [name, setName] = useState("");
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null); // { id, status, notes, remove: [], files: [] }
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const startEdit = (q) => { setDel(null); setEdit({ id: q.id, status: q.resultStatus || "normal", notes: q.notes || "", remove: [], files: [], names: q.files || [] }); };
  const keptCount = edit ? edit.names.length - edit.remove.length + edit.files.length : 0;
  const saveEdit = async () => {
    if (!edit || keptCount < 1) return toast(t("lr_keep_one"));
    setBusy(true);
    const r = await act(() => api.editResult(edit.id, { files: edit.files, notes: edit.notes, status: edit.status, remove: edit.remove }), "lr_saved");
    setBusy(false);
    if (r) { setEdit(null); refresh(); }
  };
  const doDelete = async (id) => {
    setBusy(true);
    const ok = await act(() => api.deleteResult(id), "lr_deleted");
    setBusy(false);
    if (ok) { setDel(null); setRows((l) => l.filter((x) => x.id !== id)); refresh(); }
  };

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
              <th>{t("orderNo")}</th><th>{t("patient")}</th><th>{t("exam")}</th><th>{t("resultCol")}</th><th>{t("filesCol")}</th><th>{t("uploadDate")}</th><th></th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={7} className="sub">{t("noResults")}</td></tr> : rows.map((q) => (
                <Fragment key={q.id}><tr>
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
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button type="button" className="btn s o" onClick={() => startEdit(q)}><Icon name="edit" size={14} />{t("lr_edit")}</button>{" "}
                    <button type="button" className="btn s o dg" onClick={() => { setEdit(null); setDel(q.id); }}><Icon name="x" size={14} />{t("lr_delete")}</button>
                  </td>
                </tr>
                {del === q.id && <tr><td colSpan={7}><ConfirmForm message={t("lr_del_q", { name: q.name })} confirmLabel={t("lr_delete")} busy={busy} onConfirm={() => doDelete(q.id)} onCancel={() => setDel(null)} /></td></tr>}
                {edit?.id === q.id && (
                  <tr><td colSpan={7}>
                    <div className="card" style={{ background: "var(--pr2)" }}>
                      <label>{t("resStatus")}</label>
                      <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                        {["normal", "low", "high", "followup"].map((k) => <option key={k} value={k}>{t(`rs_${k}`)}</option>)}
                      </select>
                      <label>{t("notes")}</label>
                      <textarea rows={3} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
                      <label>{t("files")}</label>
                      {edit.names.map((f, i) => {
                        const gone = edit.remove.includes(i);
                        return (
                          <div className="row" key={i} style={{ padding: "6px 0", opacity: gone ? 0.45 : 1 }}>
                            <Icon name="clip" size={16} />
                            <div className="m" dir="ltr" style={{ textAlign: "start", textDecoration: gone ? "line-through" : "none" }}>{f}</div>
                            <button type="button" className="btn s o" onClick={() => setEdit({ ...edit, remove: gone ? edit.remove.filter((x) => x !== i) : [...edit.remove, i] })}>{gone ? t("lr_undo") : t("lr_remove_file")}</button>
                          </div>
                        );
                      })}
                      {edit.files.map((f, i) => (
                        <div className="row" key={`n${i}`} style={{ padding: "6px 0" }}>
                          <Icon name="upload" size={16} />
                          <div className="m" dir="ltr" style={{ textAlign: "start" }}>{f.name}</div>
                          <button type="button" className="btn s o" onClick={() => setEdit({ ...edit, files: edit.files.filter((_, j) => j !== i) })}>{t("lr_remove_file")}</button>
                        </div>
                      ))}
                      <label className="btn s o" style={{ display: "inline-flex", marginTop: 8, cursor: "pointer" }}>
                        <input type="file" multiple accept=".pdf,.dcm,image/*" style={{ display: "none" }} onChange={(e) => { setEdit({ ...edit, files: [...edit.files, ...e.target.files] }); e.target.value = ""; }} />
                        <Icon name="plus" size={14} />{t("lr_add_files")}
                      </label>
                      <div className="btn-row">
                        <button type="button" className="btn" disabled={busy} onClick={saveEdit}>{busy ? t("loading") : t("lr_save")}</button>
                        <button type="button" className="btn o" onClick={() => setEdit(null)}>{t("lr_cancel")}</button>
                      </div>
                    </div>
                  </td></tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
