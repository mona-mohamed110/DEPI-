import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (tries++ < 20) {
        timer = setTimeout(tryScroll, 50); // الصفحة الرئيسية قد تتأخر لحظة في التحميل
      }
    };

    timer = setTimeout(tryScroll, 0);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}