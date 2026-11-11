import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { loadDrugs, searchDrugs } from '../../api/public.js';

// قائمة منسدلة بها بحث لاختيار الدواء (البيانات من api/public.js → loadDrugs)
export default function DrugPicker({ selected, onSelect }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [drugs, setDrugs] = useState(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const dq = useDeferredValue(q);

  useEffect(() => {
    if (!open || drugs) return undefined;
    let alive = true;
    setError(false);
    loadDrugs().then((d) => alive && setDrugs(d)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [open, drugs]);
  useEffect(() => {
    if (!open) return undefined;
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);
  const results = useMemo(() => (drugs ? searchDrugs(drugs, dq) : []), [drugs, dq]);
  useEffect(() => setActive(0), [dq]);

  const pick = (d) => { onSelect(d); setQ(''); setOpen(false); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && open && results[active]) { e.preventDefault(); pick(results[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };
  const shown = open ? q : selected ? selected.commercial_name_en : q;
  let body;
  if (error) body = <div className="state">{t('drug_error')}</div>;
  else if (!drugs) body = <div className="state">{t('drug_loading')}</div>;
  else if (q.trim().length < 2) body = <div className="state">{t('drug_hint')}</div>;
  else if (results.length === 0) body = <div className="state">{t('drug_none')}</div>;
  else body = results.map((d, i) => (
    <button type="button" key={`${d.commercial_name_en}-${i}`} className={`combo-item ${i === active ? 'on' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => pick(d)}>
      <b dir="ltr">{d.commercial_name_en}</b>{d.commercial_name_ar && <span> {d.commercial_name_ar}</span>}
      <small dir="ltr">{d.scientific_name} · {d.manufacturer}{d.price_egp ? ` · ${d.price_egp} EGP` : ''}</small>
    </button>
  ));

  return (
    <div className="combo" ref={ref}>
      <div className="search"><Icon name="search" size={18} />
        <input value={shown} placeholder={t('drug_search_ph')} autoComplete="off" dir="auto" onFocus={() => setOpen(true)} onKeyDown={onKey}
          onChange={(e) => { setQ(e.target.value); setOpen(true); if (selected) onSelect(null); }} />
      </div>
      {open && <div className="combo-list">{body}</div>}
    </div>
  );
}
