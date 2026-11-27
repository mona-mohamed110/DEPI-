import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../../api/patient.js';

// عدّاد الأذونات النشطة اللي بيظهر في السايدبار (بيتحدث مع كل تنقل وبعد أي سحب إذن)
const Ctx = createContext({ permCount: 0, rejCount: 0, refreshPerms: () => {}, refreshRej: () => {} });
export const usePatient = () => useContext(Ctx);
export const usePatientBadges = () => { const p = usePatient(); return { nav_perm: p.permCount, nav_appts: p.rejCount }; };

export function PatientProvider({ children }) {
  const { pathname } = useLocation();
  const [permCount, setCount] = useState(0);
  const [rejCount, setRej] = useState(0); // طلبات حجز مرفوضة لم يطّلع عليها المريض
  const refreshRej = useCallback(async () => { try { setRej((await api.getRejectionCount()).count || 0); } catch { /* ignore */ } }, []);
  useEffect(() => { refreshRej(); }, [pathname, refreshRej]);
  const refreshPerms = useCallback(async () => { try { setCount((await api.getActivePermissions()).length); } catch { /* ignore */ } }, []);
  useEffect(() => { refreshPerms(); }, [pathname, refreshPerms]);
  const value = useMemo(() => ({ permCount, rejCount, refreshPerms, refreshRej }), [permCount, rejCount, refreshPerms, refreshRej]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
