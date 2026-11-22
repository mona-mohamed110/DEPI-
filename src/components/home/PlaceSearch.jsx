import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { searchPlaces } from '../../api/public.js';

function Pin({ type, active }) {
  const s = active ? 1.25 : 1;
  return (
    <svg width={34 * s} height={44 * s} viewBox="0 0 36 46" className={`pin-svg ${type}`}>
      <path d="M18 45C18 45 3 28 3 17a15 15 0 0130 0c0 11-15 28-15 28z" className="pin-body" strokeWidth="2.5" />
      <circle cx="18" cy="17" r="9" className="pin-hole" />
      {type === 'lab' ? <path d="M15 11h6v3l3 6a2 2 0 01-2 3h-8a2 2 0 01-2-3l3-6z" className="pin-body" /> : <path d="M16.5 11h3v3.5H23v3h-3.5V21h-3v-3.5H13v-3h3.5z" className="pin-body" />}
    </svg>
  );
}

function MapView({ places, selected, onSelect }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const zoom = (d) => setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.8, +(v.scale + d).toFixed(2))) }));
  const down = (e) => { if (e.target.closest('.pin,.zoom-btn')) return; drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (drag.current) setView((v) => ({ ...v, x: drag.current.ox + e.clientX - drag.current.sx, y: drag.current.oy + e.clientY - drag.current.sy })); };
  return (
    <div className="map-view" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onWheel={(e) => zoom(e.deltaY < 0 ? 0.1 : -0.1)}>
      <div className="map-layer" style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})` }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="map-svg">
          <rect width="100" height="100" className="m-bg" />
          <rect x="4" y="44" width="14" height="10" rx="2" className="m-park" /><rect x="74" y="8" width="18" height="12" rx="2" className="m-park" /><rect x="48" y="86" width="20" height="9" rx="2" className="m-park" />
          <path d="M-5 78 C 20 68, 30 90, 52 76 S 85 58, 105 66 L105 80 C 85 72, 70 90, 52 90 S 20 80, -5 92 Z" className="m-water" />
          <g className="m-road" strokeWidth="2.2" fill="none" strokeLinecap="round"><path d="M0 22 L100 30" /><path d="M0 48 L100 44" /><path d="M0 66 L100 58" /><path d="M28 0 L36 100" /><path d="M54 0 L50 100" /><path d="M78 0 L84 100" /></g>
        </svg>
        {places.map((p) => (
          <button type="button" key={p.id} className={`pin ${selected?.id === p.id ? 'on' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-100%) scale(${1 / view.scale})` }} onClick={() => onSelect(p)} aria-label={p.name?.ar || p.name?.en}>
            <Pin type={p.type} active={selected?.id === p.id} />
          </button>
        ))}
        <span className="me-dot" style={{ transform: `translate(-50%,-50%) scale(${1 / view.scale})` }} />
      </div>
      <div className="zoom-box">
        <button type="button" className="zoom-btn" onClick={() => zoom(0.25)} aria-label="+">+</button>
        <button type="button" className="zoom-btn" onClick={() => zoom(-0.25)} aria-label="-">−</button>
        <button type="button" className="zoom-btn" onClick={() => setView({ scale: 1, x: 0, y: 0 })}><Icon name="mapPin" size={16} /></button>
      </div>
    </div>
  );
}


// بحث الأطباء والمعامل (قائمة + خريطة) — بيتستخدم في الصفحة العامة وجوه صفحة حجز المريض
export default function PlaceSearch({ onPick, note, title = true }) {
  const { t, L, num } = useI18n();
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true);
      searchPlaces({ type, q: q.trim() }).then((r) => alive && setPlaces(r)).catch(() => alive && setPlaces([])).finally(() => alive && setLoading(false));
    }, 200);
    return () => { alive = false; clearTimeout(timer); };
  }, [type, q]);

  const shown = useMemo(() => places, [places]);
  return (
    <div className="place-search">
      {title && (<><h1 className="sec-title">{t('sr_title')}</h1><p className="sec-sub">{t('sr_sub')}</p></>)}
      <div className="sr-bar">
        <div className="sr-input"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sr_ph')} maxLength={80} /></div>
        <div className="chips">{[['', 'sr_all'], ['doctor', 'sr_doctor'], ['lab', 'sr_lab']].map(([v, k]) => <button type="button" key={v} className={`chip ${type === v ? 'on' : ''}`} onClick={() => setType(v)}>{t(k)}</button>)}</div>
      </div>
      <div className="sr-grid">
        <div className="sr-list">
          {loading ? <div className="state">{t('loading')}</div> : shown.length === 0 ? <div className="state">{t('sr_none')}</div> : shown.map((p) => (
            <article key={p.id} className={`sr-card ${selected?.id === p.id ? 'on' : ''}`} onClick={() => setSelected(p)}>
              <div className="sr-ic"><Icon name={p.type === 'lab' ? 'flask' : 'stethoscope'} size={22} /></div>
              <div className="sr-info"><b>{L(p.name)}</b><span>{L(p.specialty)}</span><small><Icon name="mapPin" size={13} /> {L(p.address)} · {L(p.city)}</small></div>
              <div className="sr-side"><span className="rate"><Icon name="star" size={14} />{num(p.rating)}</span>
                <button type="button" className="btn s" onClick={(e) => { e.stopPropagation(); onPick(p); }}>{t('sr_book')}</button></div>
            </article>
          ))}
          {note}
        </div>
        <div>
          <MapView places={shown} selected={selected} onSelect={setSelected} />
          <div className="map-legend"><span><i className="d-doc" />{t('sr_legend_doc')}</span><span><i className="d-lab" />{t('sr_legend_lab')}</span></div>
        </div>
      </div>
    </div>
  );
}
