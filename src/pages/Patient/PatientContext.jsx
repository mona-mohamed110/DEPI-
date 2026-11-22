import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../../api/patient.js';

// عدّاد الأذونات النشطة اللي بيظهر في السايدبار (بيتحدث مع كل تنقل وبعد أي سحب إذن)
const Ctx = createContext({ permCount: 0, refreshPerms: () => {} });
export const usePatient = () => useContext(Ctx);
export const usePatientBadges = () => ({ nav_perm: usePatient().permCount });

export function PatientProvider({ children }) {
  const { pathname } = useLocation();
  const [permCount, setCount] = useState(0);
  const refreshPerms = useCallback(async () => { try { setCount((await api.getActivePermissions()).length); } catch { /* ignore */ } }, []);
  useEffect(() => { refreshPerms(); }, [pathname, refreshPerms]);
  const value = useMemo(() => ({ permCount, refreshPerms }), [permCount, refreshPerms]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
