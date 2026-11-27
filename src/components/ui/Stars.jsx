// نجوم التقييم: عرض فقط (value) أو اختيار (onChange)
export default function Stars({ value = 0, onChange, size = 22, label }) {
  const star = (n) => {
    const on = n <= Math.round(value);
    const glyph = <span style={{ color: on ? '#f5a524' : 'var(--bd, #cbd5e1)', fontSize: size, lineHeight: 1 }}>★</span>;
    if (!onChange) return <span key={n}>{glyph}</span>;
    return <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n}`} aria-pressed={n === value} style={{ background: 'none', border: 0, padding: 2, cursor: 'pointer' }}>{glyph}</button>;
  };
  return <span role={onChange ? 'radiogroup' : 'img'} aria-label={label} dir="ltr" style={{ display: 'inline-flex', gap: 2 }}>{[1, 2, 3, 4, 5].map(star)}</span>;
}
