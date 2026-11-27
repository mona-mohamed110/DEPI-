// صورة البروفايل أو حرف الاسم الأول إن لم توجد صورة
export default function Avatar({ name = '', src = '', size = 64, className = 'avatar' }) {
  const box = { width: size, height: size, borderRadius: '50%', flex: 'none' };
  if (src) return <img className={className} src={src} alt="" style={{ ...box, objectFit: 'cover' }} />;
  return <div className={className} style={{ ...box, fontSize: Math.round(size * 0.4) }}>{String(name).trim().charAt(0)}</div>;
}
