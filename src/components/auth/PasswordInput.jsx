import { useState } from 'react';
import Icon from '../Icon.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', placeholder }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input id={id} type={show ? 'text' : 'password'} dir="ltr" value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} maxLength={128} />
      <button type="button" className="pw-eye" dir="ltr" onClick={() => setShow((s) => !s)} aria-label={show ? t('lg_hide') : t('lg_show')}><Icon name={show ? 'eyeOff' : 'eye'} size={18} /></button>
    </div>
  );
}
