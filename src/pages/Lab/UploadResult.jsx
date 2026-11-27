import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLab } from "./LabContext.jsx";
import * as api from "../../api/lab.js";
const { fileType } = api;
import Icon from "../../components/Icon.jsx";
import DayPicker from "./DayPicker.jsx";

export default function UploadResult() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, testName, requests, uploadResult, toast, day, setDay, requestDays, inDay } = useLab();
  const [allPending, setAllPending] = useState([]); // الطلبات اللي لسه ماترفعش ليها نتيجة (فلترة من الـ API)
  const [sel, setSel] = useState("");
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("normal");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    api.getRequests("pending").then((list) => {
      if (off) return;
      setAllPending(list);
    }).catch(() => toast(t("error")));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // المعروض: طلبات اليوم المحدد فقط (+ الطلب القادم من رابط مباشر حتى لو من يوم آخر)
  const pending = allPending.filter((x) => inDay(x) || String(x.id) === String(id));
  useEffect(() => {
    setSel((s) => (id && pending.some((x) => String(x.id) === id) ? id : pending.some((x) => String(x.id) === String(s)) ? s : pending[0] ? String(pending[0].id) : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPending, day, id]);

  const submit = async () => {
    const q = pending.find((x) => String(x.id) === String(sel));
    if (!q) return toast(t("noPending"));
    if (!files.length) return toast(t("pickFile"));
    setBusy(true);
    const r = await uploadResult(q.id, { files, notes, status });
    setBusy(false);
    if (r) { toast(t("uploadedOk", { name: q.name })); nav("/lab/results"); }
  };

  return (
    <section>
      <h1>{t("upTitle")}</h1>
      <p className="sub">{t("upSub")}</p>
      <div className="card narrow">
        <div className="filters"><DayPicker value={day} dates={requestDays} onChange={setDay} /></div>
        <label>{t("reqLabel")}</label>
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {pending.length === 0 && <option value="">{t(day ? "noPendingDay" : "noPending")}</option>}
          {pending.map((r) => <option key={r.id} value={r.id}>#{r.id} · {r.name} · {testName(r.test)}</option>)}
        </select>

        <label>{t("files")}</label>
        <label className="drop">
          <input type="file" multiple accept=".pdf,.dcm,image/*" onChange={(e) => setFiles([...e.target.files])} />
          <Icon name="upload" size={32} />
          <b>{t("pickFiles")}</b>
          <small>{t("fileTypes")}</small>
        </label>
        {files.map((f) => (
          <div className="row" key={f.name + f.size} style={{ padding: "8px 0" }}>
            <Icon name="clip" size={18} />
            <div className="m" dir="ltr" style={{ textAlign: "start" }}>{f.name}</div>
            <span className="badge">{fileType(f.name)}</span>
          </div>
        ))}

        <label>{t("resStatus")}</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["normal", "low", "high", "followup"].map((k) => <option key={k} value={k}>{t(`rs_${k}`)}</option>)}
        </select>

        <label>{t("notes")}</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPh")} />
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={submit} disabled={busy}>{busy ? t("loading") : t("uploadSubmit")}</button>
        </div>
      </div>
    </section>
  );
}
