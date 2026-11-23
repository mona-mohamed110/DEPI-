import { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { searchPlaces } from '../../api/public.js';
import LeafletMap, { hasPos, distanceKm } from '../ui/LeafletMap.jsx';

// بحث الأطباء والمعامل (قائمة + خريطة) — بيتستخدم في الصفحة العامة وجوه صفحة حجز المريض
export default function PlaceSearch({ onPick, note, title = true }) {
  const { t, L, num } = useI18n();
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [me, setMe] = useState(null);
  const [near, setNear] = useState(false);
  const [geoErr, setGeoErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true);
      searchPlaces({ type, q: q.trim() }).then((r) => alive && setPlaces(r)).catch(() => alive && setPlaces([])).finally(() => alive && setLoading(false));
    }, 200);
    return () => { alive = false; clearTimeout(timer); };
  }, [type, q]);

  // ترتيب الأقرب أولاً بعد تحديد موقع المستخدم (الأماكن بدون إحداثيات تأتي في الآخر)
  const shown = useMemo(() => {
    if (!near || !me) return places;
    const d = (p) => (hasPos(p) ? distanceKm(me, p) : Infinity);
    return [...places].sort((a, b) => d(a) - d(b));
  }, [places, near, me]);
  const locate = () => {
    if (near) { setNear(false); return; }
    setGeoErr(false);
    if (!navigator.geolocation) { setGeoErr(true); return; }
    navigator.geolocation.getCurrentPosition(
      (g) => { setMe({ lat: g.coords.latitude, lng: g.coords.longitude }); setNear(true); },
      () => setGeoErr(true),
      { timeout: 10000 },
    );
  };
  return (
    <div className="place-search">
      {title && (<><h1 className="sec-title">{t('sr_title')}</h1><p className="sec-sub">{t('sr_sub')}</p></>)}
      <div className="sr-bar">
        <div className="sr-input"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sr_ph')} maxLength={80} /></div>
        <div className="chips">{[['', 'sr_all'], ['doctor', 'sr_doctor'], ['lab', 'sr_lab']].map(([v, k]) => <button type="button" key={v} className={`chip ${type === v ? 'on' : ''}`} onClick={() => setType(v)}>{t(k)}</button>)}
          <button type="button" className={`chip sr-near ${near ? 'on' : ''}`} onClick={locate}><Icon name="mapPin" size={14} />{t('near_me')}</button></div>
      </div>
      <div className="sr-grid">
        <div className="sr-list">
          {loading ? <div className="state">{t('loading')}</div> : shown.length === 0 ? <div className="state">{t('sr_none')}</div> : shown.map((p) => (
            <article key={p.id} className={`sr-card ${selected?.id === p.id ? 'on' : ''}`} onClick={() => setSelected(p)}>
              <div className="sr-ic"><Icon name={p.type === 'lab' ? 'flask' : 'stethoscope'} size={22} /></div>
              <div className="sr-info"><b>{L(p.name)}</b><span>{L(p.specialty)}</span><small><Icon name="mapPin" size={13} /> {L(p.address)} · {L(p.city)}{near && me && hasPos(p) && <> · <span className="sr-dist">{num(Math.round(distanceKm(me, p) * 10) / 10)} {t('km')}</span></>}</small>
                {hasPos(p) && <a className="sr-dir" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{t('directions')}</a>}</div>
              <div className="sr-side"><span className="rate"><Icon name="star" size={14} />{num(p.rating)}</span>
                <button type="button" className="btn s" onClick={(e) => { e.stopPropagation(); onPick(p); }}>{t('sr_book')}</button></div>
            </article>
          ))}
          {note}
        </div>
        <div>
          <LeafletMap places={shown} selectedId={selected?.id} onSelect={setSelected} userPos={near ? me : null} label={(p) => L(p.name)} />
          {geoErr && <p className="sec-sub" style={{ fontSize: 13 }}>{t('loc_denied')}</p>}
          {!loading && shown.length > 0 && !shown.some(hasPos) && <p className="sec-sub" style={{ fontSize: 13 }}>{t('map_no_coords')}</p>}
          <div className="map-legend"><span><i className="d-doc" />{t('sr_legend_doc')}</span><span><i className="d-lab" />{t('sr_legend_lab')}</span></div>
        </div>
      </div>
    </div>
  );
}
