// تحديد موقع العيادة/المعمل على الخريطة وحفظه (للطبيب والمعمل)
import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import LeafletMap, { hasPos } from './LeafletMap.jsx';
import { useToast } from './Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { getLocation, saveLocation } from '../../api/shared.js';

export default function LocationPicker({ height = 280 }) {
  const { t, num } = useI18n();
  const { act, toast } = useToast();
  const [pos, setPos] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getLocation().then((r) => { if (alive && hasPos(r)) setPos({ lat: r.lat, lng: r.lng }); }).catch(() => {}).finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  const set = (lat, lng) => { setPos({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) }); setDirty(true); };
  const locate = () => {
    if (!navigator.geolocation) return toast(t('loc_denied'));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (g) => { set(g.coords.latitude, g.coords.longitude); setBusy(false); },
      () => { toast(t('loc_denied')); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const save = async () => { if (await act(() => saveLocation(pos), 'loc_saved')) setDirty(false); };

  return (
    <div className="loc-picker">
      <h2 style={{ marginTop: 22 }}>{t('loc_title')}</h2>
      <p className="sub" style={{ margin: '0 0 10px' }}><Icon name="mapPin" size={15} /> {loaded && !pos ? t('loc_none') : t('loc_hint')}</p>
      <LeafletMap picker value={pos} onPick={set} height={height} />
      <div className="loc-bar">
        {pos && <span className="loc-coords" dir="ltr">{num(pos.lat.toFixed(5))}, {num(pos.lng.toFixed(5))}</span>}
        <button type="button" className="btn s" onClick={locate} disabled={busy}><Icon name="mapPin" size={15} /> {t('loc_use_mine')}</button>
        <button type="button" className="btn" onClick={save} disabled={!pos || !dirty}>{t('loc_save')}</button>
      </div>
    </div>
  );
}
