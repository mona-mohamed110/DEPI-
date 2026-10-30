import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as api from "../services/labApi";
import { translate } from "../i18nLab";

const Ctx = createContext(null);
export const useLab = () => useContext(Ctx);

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };

export function LabProvider({ children }) {
  const [lang, setLang] = useState(() => read("lab_lang", "ar"));
  const [theme, setTheme] = useState(() => read("lab_theme", "light"));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const timer = useRef();

  useEffect(() => { try { localStorage.setItem("lab_lang", lang); } catch { /* ignore */ } }, [lang]);
  useEffect(() => { try { localStorage.setItem("lab_theme", theme); } catch { /* ignore */ } }, [theme]);

  const t = useCallback((k, v) => translate(lang, k, v), [lang]);
  const tRef = useRef(t);
  tRef.current = t;

  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const num = (n) => Number(n).toLocaleString(locale);
  const fmtDateTime = (iso) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const fmtDay = (key) => new Date(`${key}T00:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(""), 2300);
  }, []);

  const refresh = useCallback(async () => {
    try { setRequests(await api.getRequests()); }
    catch { toast(tRef.current("error")); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (fn, okMsg) => {
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
    catch { toast(tRef.current("error")); return null; }
  };

  const addRequest = (data) => run(async () => {
    const r = await api.createRequest(data);
    setRequests((p) => [r, ...p]);
    return r;
  }, t("added"));

  const startRequest = (id) => run(async () => {
    const r = await api.startRequest(id);
    setRequests((p) => p.map((x) => (x.id == id ? r : x)));
    return r;
  }, t("started"));

  const uploadResult = (id, payload) => run(async () => {
    const r = await api.uploadResult(id, payload);
    setRequests((p) => p.map((x) => (x.id == id ? r : x)));
    return r;
  }, null);

  // الأرقام بتتحدث تلقائياً لما الطلبات تتغير
  const counts = useMemo(() => ({
    new: requests.filter((r) => r.status === "new").length,
    progress: requests.filter((r) => r.status === "progress").length,
    done: requests.filter((r) => r.status === "done").length,
    total: requests.length,
  }), [requests]);

  const value = {
    lang, setLang, theme, setTheme, t, num, fmtDateTime, fmtDay,
    requests, counts, loading, toast, toastMsg, addRequest, startRequest, uploadResult, refresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
