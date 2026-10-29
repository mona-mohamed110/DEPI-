import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';
import { loadDrugs, searchDrugs } from '../../services/drugsApi.js';

// قائمة منسدلة بها بحث لاختيار الدواء من ملف egyptian-drugs.json
export default function DrugPicker({ selected, onSelect }) {
  const { t } = useDoctor();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [drugs, setDrugs] = useState(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const deferredQ = useDeferredValue(q);

  // تحميل القائمة عند أول فتح فقط
  useEffect(() => {
    if (!open || drugs) return undefined;
    let alive = true;
    setError(false);
    loadDrugs()
      .then((d) => alive && setDrugs(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [open, drugs]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const results = useMemo(() => (drugs ? searchDrugs(drugs, deferredQ) : []), [drugs, deferredQ]);

  useEffect(() => setActive(0), [deferredQ]);

  const pick = (d) => {
    onSelect(d);
    setQ('');
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const shown = open ? q : selected ? selected.commercial_name_en : q;
  let body = null;
  if (open) {
    if (error) body = <div className="d-combo-msg">{t('drug_error')}</div>;
    else if (!drugs) body = <div className="d-combo-msg">{t('drug_loading')}</div>;
    else if (q.trim().length < 2) body = <div className="d-combo-msg">{t('drug_hint')}</div>;
    else if (results.length === 0) body = <div className="d-combo-msg">{t('drug_none')}</div>;
    else
      body = results.map((d, i) => (
        <button
          type="button"
          key={`${d.commercial_name_en}-${i}`}
          className={`d-combo-item ${i === active ? 'active' : ''}`}
          onMouseEnter={() => setActive(i)}
          onClick={() => pick(d)}
        >
          <b dir="ltr">{d.commercial_name_en}</b>
          {d.commercial_name_ar && <span>{d.commercial_name_ar}</span>}
          <small dir="ltr">
            {d.scientific_name} · {d.manufacturer}
            {d.price_egp ? ` · ${d.price_egp} EGP` : ''}
          </small>
        </button>
      ));
  }

  return (
    <div className="d-combo" ref={ref}>
      <div className="d-search">
        <Search size={17} />
        <input
          value={shown}
          placeholder={t('drug_search_ph')}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (selected) onSelect(null);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          dir="auto"
        />
      </div>
      {open && <div className="d-combo-list">{body}</div>}
    </div>
  );
}
