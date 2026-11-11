// حالة تسجيل الدخول. كل المنطق الحقيقي في src/api/auth.js
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { clearSession, getSession, patchSessionUser } from '../api/security.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [ready, setReady] = useState(false);

  // نتأكد من الجلسة مع السيرفر عند فتح الموقع
  useEffect(() => {
    let alive = true;
    if (!getSession()) { setReady(true); return undefined; }
    authApi.me().then((u) => alive && setUser(u)).catch(() => { clearSession(); alive && setUser(null); }).finally(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const off = () => setUser(null);
    window.addEventListener('shefaa:unauthorized', off);
    return () => window.removeEventListener('shefaa:unauthorized', off);
  }, []);

  const login = useCallback(async (email, password) => { const u = await authApi.login(email, password); setUser(u); return u; }, []);
  const logout = useCallback(async () => { await authApi.logout(); setUser(null); }, []);
  const updateUser = useCallback((patch) => { patchSessionUser(patch); setUser((u) => (u ? { ...u, ...patch } : u)); }, []);

  const value = useMemo(() => ({ user, ready, login, logout, updateUser, register: authApi.register }), [user, ready, login, logout, updateUser]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
