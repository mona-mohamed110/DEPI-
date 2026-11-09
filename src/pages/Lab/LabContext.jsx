// حالة لوحة المعمل: الطلبات والأرقام. كل الاتصال بالسيرفر من src/api/lab.js
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../../api/lab.js';
import { TEST_CATALOG } from '../../config/catalog.js';
import { useI18n } from '../../context/I18nContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

const Ctx = createContext(null);

export function LabProvider({ children }) {
  const { lang } = useI18n();
  const { toast, act } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // أسماء الفحوصات بتتخزن بالعربي في الداتا، وهنا بتتعرض بلغة الواجهة
  const testName = useCallback((name) => (lang === 'ar' ? name : TEST_CATALOG.find((x) => x.ar === name)?.en || name), [lang]);

  const refresh = useCallback(async () => {
    try { setRequests(await api.getRequests()); } catch { toast('⚠'); } finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { refresh(); }, [refresh]);

  const replace = (r) => setRequests((p) => p.map((x) => (x.id === r.id ? r : x)));
  const addRequest = (data) => act(async () => { const r = await api.createRequest(data); setRequests((p) => [r, ...p]); return r; }, 'added');
  const startRequest = (id) => act(async () => { const r = await api.startRequest(id); replace(r); return r; }, 'started');
  const uploadResult = (id, payload) => act(async () => { const r = await api.uploadResult(id, payload); replace(r); return r; });

  const counts = useMemo(() => ({
    new: requests.filter((r) => r.status === 'new').length,
    progress: requests.filter((r) => r.status === 'progress').length,
    done: requests.filter((r) => r.status === 'done').length,
    total: requests.length,
  }), [requests]);

  const value = { requests, counts, loading, testName, addRequest, startRequest, uploadResult, refresh };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// بيرجع كل حاجة الصفحة محتاجاها: الترجمة + التوست + حالة المعمل
export function useLab() {
  const lab = useContext(Ctx);
  const i18n = useI18n();
  const tst = useToast();
  return { ...i18n, ...tst, ...lab };
}
export const useLabBadges = () => ({ navDashboard: useContext(Ctx).counts.new });
