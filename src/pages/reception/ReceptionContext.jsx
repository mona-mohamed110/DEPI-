import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../../api/reception.js';

// عدّاد طلبات الحجز الجديدة في السايدبار
const Ctx = createContext({ pending: 0, refresh: () => {} });
export const useReception = () => useContext(Ctx);
export const useReceptionBadges = () => ({ nav_dash: useReception().pending });

export function ReceptionProvider({ children }) {
  const { pathname } = useLocation();
  const [pending, setPending] = useState(0);
  const refresh = useCallback(async () => { try { setPending((await api.getRequests()).length); } catch { /* ignore */ } }, []);
  useEffect(() => { refresh(); }, [pathname, refresh]);
  const value = useMemo(() => ({ pending, refresh }), [pending, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
