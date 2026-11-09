// خريطة توضيحية بسيطة (SVG) بألوان تتغير مع الوضع الداكن. استبدلها بخريطة حقيقية (Google Maps / Leaflet) لما تجهز.
export default function MapArt({ height = 170 }) {
  return (
    <div className="map" style={{ height }} aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice">
        <path className="map-road" d="M0 100 L400 60" strokeWidth="14" />
        <path className="map-road" d="M160 0 L220 170" strokeWidth="10" />
        <path className="map-road" d="M0 30 L300 170" strokeWidth="6" />
        <rect className="map-block" x="250" y="90" width="60" height="40" rx="6" />
        <rect className="map-block" x="40" y="110" width="70" height="40" rx="6" />
        <path className="map-pin" d="M200 44 a14 14 0 1 1 .1 0 l-.1 0 -14 28 z" />
        <circle className="map-dot" cx="200" cy="40" r="5" />
      </svg>
    </div>
  );
}
