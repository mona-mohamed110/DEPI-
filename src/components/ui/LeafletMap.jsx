// خريطة حقيقية (OpenStreetMap عبر Leaflet) — بدون مفتاح API.
// وضعان:
//   1) عرض أماكن: <LeafletMap places={[{id,type,name,lat,lng}]} selectedId onSelect userPos />
//   2) اختيار موقع: <LeafletMap picker value={{lat,lng}|null} onPick={(lat,lng)=>...} />
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/map.css';
import { pinHtml } from './pinHtml.js';

const CAIRO = [30.0444, 31.2357];
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export const hasPos = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng);

// المسافة بالكيلومتر بين نقطتين (Haversine)
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const icon = (type, active) => L.divIcon({
  html: pinHtml(type, active), className: 'lf-pin',
  iconSize: [34 * (active ? 1.25 : 1), 44 * (active ? 1.25 : 1)],
  iconAnchor: [17 * (active ? 1.25 : 1), 44 * (active ? 1.25 : 1)],
});

export default function LeafletMap({ places = [], selectedId, onSelect, userPos, picker = false, value, onPick, height, className = '', label = (p) => p.name }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const me = useRef(null);
  const pick = useRef(null);
  const fitKey = useRef('');
  const cb = useRef({});
  cb.current = { onSelect, onPick, label };

  // إنشاء الخريطة مرة واحدة
  useEffect(() => {
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(CAIRO, 11);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTR }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    if (picker) m.on('click', (e) => cb.current.onPick?.(e.latlng.lat, e.latlng.lng));
    const t = setTimeout(() => m.invalidateSize(), 150);
    return () => { clearTimeout(t); m.remove(); map.current = null; me.current = null; pick.current = null; fitKey.current = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // دبابيس الأماكن
  useEffect(() => {
    const m = map.current;
    if (!m || picker) return;
    layer.current.clearLayers();
    const list = places.filter(hasPos);
    list.forEach((p) => {
      const mk = L.marker([p.lat, p.lng], { icon: icon(p.type, p.id === selectedId), title: String(cb.current.label(p) ?? ''), keyboard: true, zIndexOffset: p.id === selectedId ? 1000 : 0 });
      mk.on('click', () => cb.current.onSelect?.(p));
      mk.addTo(layer.current);
    });
    const key = list.map((p) => p.id).join('|');
    if (key !== fitKey.current) {
      fitKey.current = key;
      const pts = list.map((p) => [p.lat, p.lng]);
      if (hasPos(userPos)) pts.push([userPos.lat, userPos.lng]);
      if (pts.length === 1) m.setView(pts[0], 14);
      else if (pts.length > 1) m.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    }
  }, [places, selectedId, picker, userPos]);

  // الانتقال للمكان المحدد
  useEffect(() => {
    const m = map.current;
    if (!m || picker || !selectedId) return;
    const p = places.find((x) => x.id === selectedId);
    if (hasPos(p)) m.flyTo([p.lat, p.lng], Math.max(m.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // موقع المستخدم
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (me.current) { me.current.remove(); me.current = null; }
    if (hasPos(userPos)) {
      me.current = L.circleMarker([userPos.lat, userPos.lng], { radius: 8, weight: 3, color: '#fff', fillColor: '#16a34a', fillOpacity: 1 }).addTo(m);
    }
  }, [userPos]);

  // وضع الاختيار: دبوس واحد قابل للسحب
  useEffect(() => {
    const m = map.current;
    if (!m || !picker) return;
    if (!hasPos(value)) { if (pick.current) { pick.current.remove(); pick.current = null; } return; }
    const ll = [value.lat, value.lng];
    if (!pick.current) {
      pick.current = L.marker(ll, { icon: icon('doctor', true), draggable: true }).addTo(m);
      pick.current.on('dragend', () => { const p = pick.current.getLatLng(); cb.current.onPick?.(p.lat, p.lng); });
      m.setView(ll, 15);
    } else {
      pick.current.setLatLng(ll);
      if (!m.getBounds().contains(ll)) m.setView(ll, Math.max(m.getZoom(), 15));
    }
  }, [value, picker]);

  return <div ref={box} dir="ltr" className={`lf-map ${className}`} style={height ? { height } : undefined} />;
}
