import { useCallback, useState } from 'react';
import Icon from '../Icon.jsx';
import ContactModal from './ContactModal.jsx';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// صفحة التواصل مع الإدارة داخل حساب كل مستخدم
const SUPPORT = { patient: '/patient/support', doctor: '/doctor/support', lab: '/lab/settings/support' };

export default function HelpDesk() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <section className="sec helpdesk">
      <div className="wrap center">
        <h2 className="sec-title">{t('hd_t1')} <span className="hl">{t('hd_t2')}</span> {t('hd_t3')}</h2>
        <p className="sec-sub">{t('hd_sub1')}<br />{t('hd_sub2')}</p>
        <button type="button" className="btn lg" onClick={() => (user && SUPPORT[user.role] ? navigate(SUPPORT[user.role]) : setOpen(true))}>{t('hd_btn')}<Icon name={dir === 'rtl' ? 'arrowL' : 'arrowR'} size={18} /></button>
      </div>
      <ContactModal isOpen={open} onClose={close} />
    </section>
  );
}
