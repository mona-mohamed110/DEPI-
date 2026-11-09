import { useState } from 'react';
import { PersonalCard } from '../../components/shell/AccountPages.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { BLOOD_TYPES, CHRONIC } from '../../config/catalog.js';
import * as api from '../../api/patient.js';

// البيانات الصحية الأساسية (تاريخ الميلاد، الفصيلة، الطول، الوزن، الأمراض المزمنة)
function HealthCard() {
  const { t, L, num, lang, fmtDate } = useI18n();
  const { act } = useToast();
  const state = useAsync(() => api.getProfile(), []);
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const toggle = (id) => setF((x) => ({ ...x, chronicIds: x.chronicIds.includes(id) ? x.chronicIds.filter((c) => c !== id) : [...x.chronicIds, id] }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.birthDate || new Date(f.birthDate) >= new Date()) return setErr(t('err_invalid_data'));
    setErr('');
    const r = await act(() => api.updateProfile({ birthDate: f.birthDate, blood: f.blood, height: f.height, weight: f.weight, chronicIds: f.chronicIds }), 'saved');
    if (r) { state.setData(r); setF(null); }
  };

  return (
    <div className="card">
      <Async state={state}>{(d) => (
        <>
          <h2>{t('pf_health')}</h2>
          {f ? (
            <form onSubmit={save} noValidate>
              <div className="form" style={{ width: '100%' }}>
                <div><label className="first">{t('pf_birth')}</label><input type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} /></div>
                <div><label className="first">{t('blood')}</label>
                  <select value={f.blood} onChange={(e) => setF({ ...f, blood: e.target.value })}><option value="">—</option>{BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>
                <div><label>{t('height')}</label><input inputMode="numeric" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} /></div>
                <div><label>{t('weight')}</label><input inputMode="numeric" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></div>
              </div>
              <label>{t('pf_chronic')}</label>
              <div className="chips">{CHRONIC.map((c) => <button type="button" key={c.id} className={`chip ${f.chronicIds.includes(c.id) ? 'on' : ''}`} aria-pressed={f.chronicIds.includes(c.id)} onClick={() => toggle(c.id)}>{lang === 'ar' ? c.ar : c.en}</button>)}</div>
              {err && <div className="err">{err}</div>}
              <div className="btn-row"><button className="btn" type="submit">{t('save')}</button><button type="button" className="btn o" onClick={() => setF(null)}>{t('cancel')}</button></div>
            </form>
          ) : (
            <>
              <div className="row"><span className="m">{t('pf_birth')}</span><b>{d.birthDate ? fmtDate(d.birthDate) : '—'}</b></div>
              <div className="row"><span className="m">{t('age')}</span><b>{d.age != null ? t('years', { n: num(d.age) }) : '—'}</b></div>
              <div className="row"><span className="m">{t('blood')}</span><b dir="ltr">{d.blood || '—'}</b></div>
              <div className="row"><span className="m">{t('height_weight')}</span><b>{d.height ? `${num(d.height)} ${t('cm')} / ${num(d.weight)} ${t('kg')}` : '—'}</b></div>
              <div className="row" style={{ alignItems: 'flex-start' }}><span className="m">{t('pf_chronic')}</span>
                <div className="chips">{d.chronic.length ? d.chronic.map((c, i) => <span key={i} className="badge">{L(c)}</span>) : <b>{t('d_none')}</b>}</div></div>
              <div className="btn-row"><button type="button" className="btn" onClick={() => setF({ birthDate: d.birthDate || '', blood: d.blood || '', height: d.height ?? '', weight: d.weight ?? '', chronicIds: d.chronicIds || [] })}>{t('edit')}</button></div>
            </>
          )}
        </>
      )}</Async>
    </div>
  );
}

export default function Profile() {
  const { t } = useI18n();
  return (
    <section>
      <h1>{t('profile')}</h1>
      <p className="sub">{t('pf_sub')}</p>
      <div className="fill-grid"><PersonalCard /><HealthCard /></div>
    </section>
  );
}
