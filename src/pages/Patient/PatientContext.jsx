import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../../api/patient.js';

// عدّادات السايدبار: الأذونات النشطة + التحاليل المطلوبة (بتتحدث مع كل تنقل وبعد أي تغيير)
const Ctx = createContext({ permCount: 0, labCount: 0, refreshPerms: () => {}, refreshLabs: () => {} });
export const usePatient = () => useContext(Ctx);
export const usePatientBadges = () => { const { permCount, labCount } = usePatient(); return { nav_perm: permCount, nav_res: labCount }; };

export function PatientProvider({ children }) {
  const { pathname } = useLocation();
  const [permCount, setPerm] = useState(0);
  const [labCount, setLab] = useState(0);
  const refreshPerms = useCallback(async () => { try { setPerm((await api.getActivePermissions()).length); } catch { /* ignore */ } }, []);
  const refreshLabs = useCallback(async () => { try { setLab((await api.getLabOrders('open')).filter((o) => o.items.some((i) => i.status === 'awaiting_lab')).length); } catch { /* ignore */ } }, []);
  useEffect(() => { refreshPerms(); refreshLabs(); }, [pathname, refreshPerms, refreshLabs]);
  const value = useMemo(() => ({ permCount, labCount, refreshPerms, refreshLabs }), [permCount, labCount, refreshPerms, refreshLabs]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
