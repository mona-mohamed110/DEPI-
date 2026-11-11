import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../context/I18nContext.jsx';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const { t } = useI18n();
  const [msg, setMsg] = useState('');
  const timer = useRef();

  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2600);
  }, []);

  // act: ينفّذ طلب API، يعرض رسالة نجاح بالمفتاح المترجم أو رسالة الخطأ المناسبة
  const act = useCallback(async (fn, okKey) => {
    try {
      const r = await fn();
      if (okKey) toast(t(okKey));
      return r === undefined ? true : r;
    } catch (e) {
      toast(t(`err_${e.code}`) !== `err_${e.code}` ? t(`err_${e.code}`) : t('error'));
      return null;
    }
  }, [toast, t]);

  const value = useMemo(() => ({ toast, act, msg }), [toast, act, msg]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// بيتحط جوه الـ root بتاع كل قسم عشان ياخد ستايل القسم
export function ToastView() {
  const { msg } = useContext(Ctx);
  return <div className={`toast ${msg ? 'show' : ''}`} role="status" aria-live="polite">{msg}</div>;
}
