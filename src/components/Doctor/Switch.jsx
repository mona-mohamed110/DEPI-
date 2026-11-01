import { useState } from 'react';

// مفتاح تشغيل/إيقاف. يعمل بشكل مستقل (defaultOn) أو متحكَّم به (on + onChange)
export default function Switch({ defaultOn = false, on, onChange, disabled = false, label }) {
  const [inner, setInner] = useState(defaultOn);
  const value = on ?? inner;
  const toggle = () => {
    if (disabled) return;
    if (on === undefined) setInner(!value);
    onChange?.(!value);
  };
  return (
    <button
      type="button"
      className={`d-switch ${value ? 'on' : ''}`}
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onClick={toggle}
    />
  );
}
