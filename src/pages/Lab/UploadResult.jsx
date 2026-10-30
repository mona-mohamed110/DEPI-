import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLab } from "../../context/LabContext";
import * as api from "../../services/labApi";
import { fileType } from "../../data/labData";
import Icon from "../../components/Lab/Icon";

export default function UploadResult() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, requests, uploadResult, toast } = useLab();
  const [pending, setPending] = useState([]); // الطلبات اللي لسه ماترفعش ليها نتيجة (فلترة من الـ API)
  const [sel, setSel] = useState("");
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    api.getRequests({ status: "pending" }).then((list) => {
      if (off) return;
      setPending(list);
      setSel((s) => (id && list.some((x) => String(x.id) === id) ? id : list.some((x) => String(x.id) === String(s)) ? s : list[0] ? String(list[0].id) : ""));
    }).catch(() => toast(t("error")));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, id]);

  const submit = async () => {
    const q = pending.find((x) => String(x.id) === String(sel));
    if (!q) return toast(t("noPending"));
    if (!files.length) return toast(t("pickFile"));
    setBusy(true);
    const r = await uploadResult(q.id, { files, notes });
    setBusy(false);
    if (r) { toast(t("uploadedOk", { name: q.name })); nav("/lab/results"); }
  };

  return (
    <section>
      <h1>{t("upTitle")}</h1>
      <p className="lb-sub">{t("upSub")}</p>
      <div className="lb-card lb-narrow">
        <label className="lb-first">{t("reqLabel")}</label>
        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {pending.length === 0 && <option value="">{t("noPending")}</option>}
          {pending.map((r) => <option key={r.id} value={r.id}>#{r.id} · {r.name} · {r.test}</option>)}
        </select>

        <label>{t("files")}</label>
        <label className="lb-drop">
          <input type="file" multiple accept=".pdf,.dcm,image/*" onChange={(e) => setFiles([...e.target.files])} />
          <span style={{ fontSize: 30 }}>📤</span>
          <b>{t("pickFiles")}</b>
          <small>{t("fileTypes")}</small>
        </label>
        {files.map((f) => (
          <div className="lb-row" key={f.name + f.size} style={{ padding: "8px 0" }}>
            <Icon name="clip" size={18} />
            <div className="lb-m" dir="ltr" style={{ textAlign: "start" }}>{f.name}</div>
            <span className="lb-badge">{fileType(f.name)}</span>
          </div>
        ))}

        <label>{t("notes")}</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPh")} />
        <div style={{ marginTop: 16 }}>
          <button type="button" className="lb-btn" onClick={submit} disabled={busy}>{busy ? t("loading") : t("uploadSubmit")}</button>
        </div>
      </div>
    </section>
  );
}
