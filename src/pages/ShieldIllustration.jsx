// رسم الدرع الزجاجي مع السماعة الطبية (SVG)
export default function ShieldIllustration() {
  return (
    <svg className="auth-shield" viewBox="0 0 400 500" role="img" aria-label="">
      <defs>
        <linearGradient id="sh-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#bfdcf0" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="sh-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf5fd" />
          <stop offset="1" stopColor="#cfe5f5" />
        </linearGradient>
        <filter id="sh-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="sh-clip">
          <path d="M200 30C250 62 315 72 365 72V240C365 345 288 425 200 465C112 425 35 345 35 240V72C85 72 150 62 200 30Z" />
        </clipPath>
      </defs>

      <ellipse cx="205" cy="478" rx="110" ry="12" fill="#9cc7e6" opacity="0.35" />

      <path
        d="M200 30C250 62 315 72 365 72V240C365 345 288 425 200 465C112 425 35 345 35 240V72C85 72 150 62 200 30Z"
        fill="url(#sh-body)"
        stroke="#ffffff"
        strokeWidth="6"
      />
      <g clipPath="url(#sh-clip)">
        <rect x="200" y="0" width="200" height="500" fill="#9fcbe8" opacity="0.28" />
      </g>
      <path
        d="M200 55C243 82 296 92 340 92V240C340 330 275 398 200 434C125 398 60 330 60 240V92C104 92 157 82 200 55Z"
        fill="url(#sh-inner)"
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0.9"
      />

      <g filter="url(#sh-glow)" fill="none" stroke="#8fdde2" strokeWidth="13" strokeLinecap="round">
        <path d="M160 178V258C160 305 190 328 210 328C262 328 290 298 290 262" />
        <path d="M250 178V250C250 288 236 310 210 328" />
        <circle cx="290" cy="238" r="20" />
      </g>
      <circle cx="160" cy="170" r="8" fill="#8fdde2" />
      <circle cx="250" cy="170" r="8" fill="#8fdde2" />
    </svg>
  );
}
