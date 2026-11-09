import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// بيمرر للقسم لما الرابط فيه #hash وإلا بيرجع لأعلى الصفحة
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0, timer;
    const go = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (tries++ < 20) timer = setTimeout(go, 50);
    };
    timer = setTimeout(go, 0);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);
  return null;
}
