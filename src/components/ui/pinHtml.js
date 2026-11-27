// دبوس الخريطة (SVG نصي) لاستخدامه داخل Leaflet. الألوان من styles/map.css
export function pinHtml(type, active) {
  const s = active ? 1.25 : 1;
  const glyph = type === 'lab'
    ? '<path d="M15 11h6v3l3 6a2 2 0 01-2 3h-8a2 2 0 01-2-3l3-6z" class="pin-body"/>'
    : '<path d="M16.5 11h3v3.5H23v3h-3.5V21h-3v-3.5H13v-3h3.5z" class="pin-body"/>';
  return `<svg width="${34 * s}" height="${44 * s}" viewBox="0 0 36 46" class="pin-svg ${type === 'lab' ? 'lab' : 'doctor'}" aria-hidden="true">`
    + '<path d="M18 45C18 45 3 28 3 17a15 15 0 0130 0c0 11-15 28-15 28z" class="pin-body" stroke-width="2.5"/>'
    + `<circle cx="18" cy="17" r="9" class="pin-hole"/>${glyph}</svg>`;
}
