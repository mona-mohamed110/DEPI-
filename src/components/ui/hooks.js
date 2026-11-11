import { useCallback, useEffect, useRef, useState } from 'react';

// تحميل بيانات من الـ API:  const { data, loading, error, reload, setData } = useAsync(() => api.xxx(), [deps])
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const load = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === seq.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (id === seq.current) setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); return () => { seq.current++; }; }, deps);
  const setData = useCallback((d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })), []);
  return { ...state, reload: load, setData };
}
