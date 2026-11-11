import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/patient.js';

const CHIPS = ['sym_chip_headache', 'sym_chip_fever', 'sym_chip_chest', 'sym_chip_cough'];

export default function SymptomTriage() {
  const { t, L, lang, num } = useI18n();
  const { act, toast } = useToast();
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const addChip = (k) => { const sep = lang === 'ar' ? '، ' : ', '; setText((p) => (p.trim() ? `${p.trim()}${sep}${t(k)}` : t(k))); };
  const analyze = async () => {
    if (!text.trim()) return toast(t('sym_empty'));
    setBusy(true);
    const r = await act(() => api.triage(text));
    setBusy(false);
    if (r) setRes(r);
  };

  return (
    <section>
      <h1>{t('sym_title')}</h1>
      <p className="sub">{t('sym_sub')}</p>
      <div className="note"><Icon name="alert" size={18} /><span>{t('sym_warning')}</span></div>
      <div className="card triage-box">
        <textarea value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder={t('sym_placeholder')} />
        <div className="chips" style={{ margin: '12px 0' }}>
          {CHIPS.map((k) => <button type="button" key={k} className="chip" onClick={() => addChip(k)}>{t(k)}</button>)}
        </div>
        <button type="button" className="btn" onClick={analyze} disabled={busy}><Icon name="bot" size={18} />{busy ? t('loading') : t('sym_analyze')}</button>
      </div>

      {res && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>{t('sym_result_title')}</h2>
          <div className="row">
            <div className="res-icon"><Icon name="bot" size={22} /></div>
            <div className="m"><b>{t(res.likely)}</b><small>{t('sym_severity')}: <span className={`sev ${res.severity}`}>{t(`sev_${res.severity}`)}</span></small></div>
          </div>
          <h2 style={{ marginTop: 18 }}>{t('sym_doctors_title')}</h2>
          {res.doctors.map((d) => (
            <div className="row" key={d.id}>
              <div className="av">{L(d.name).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
              <div className="m"><b>{L(d.name)}</b><small>{L(d.specialty)} · <Icon name="star" size={13} /> {num(d.rating)}</small></div>
              <Link className="btn s" to="/patient/booking" state={{ selectedDoctor: d }}>{t('sym_book_one')}</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
