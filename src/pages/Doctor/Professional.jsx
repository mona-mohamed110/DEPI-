import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import MapArt from '../../components/ui/MapArt.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { safeUrl } from '../../api/security.js';
import * as api from '../../api/doctor.js';

export default function Professional() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  const { act } = useToast();
  const state = useAsync(() => api.getProfessional(), []);
  const fileInput = useRef(null);
  const [form, setForm] = useState(null);
  useEffect(() => { if (state.data) setForm({ license: state.data.license, specialty: state.data.specialty, clinic: L(state.data.clinic), address: L(state.data.address) }); }, [state.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const p = await act(() => api.uploadLicense(f), 'license_saved');
    if (p) state.setData(p);
  };
  const removeFile = async () => { const ok = await act(() => api.removeLicense()); if (ok) state.setData((p) => ({ ...p, licenseFile: null })); };

  return (
    <section>
      <h1>{t('prof_title')}</h1>
      <p className="sub">{t('prof_sub')}</p>
      <Async state={state}>{(p) => form && (
        <div className="grid g2">
          <div className="card">
            <div className="row" style={{ border: 0 }}>
              <div className="av" style={{ width: 56, height: 56, fontSize: 24 }}>{L(user.name).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
              <div className="m"><b style={{ fontSize: 18 }}>{L(user.name)}</b><small>{t(form.specialty)}</small></div>
              <span className="badge ok"><Icon name="check" size={14} />{t('licensed')}</span>
            </div>
            <label>{t('license_no')}</label><input value={form.license} onChange={set('license')} dir="ltr" />
            <label>{t('specialty')}</label>
            <select value={form.specialty} onChange={set('specialty')}>{['sp_internal', 'sp_cardio', 'sp_neuro'].map((k) => <option key={k} value={k}>{t(k)}</option>)}</select>
            <label>{t('clinic_name')}</label><input value={form.clinic} onChange={set('clinic')} />
            <label>{t('address')}</label><input value={form.address} onChange={set('address')} />
            <div className="btn-row"><button type="button" className="btn" onClick={() => act(() => api.saveProfessional(form), 'saved_prof')}>{t('save')}</button></div>
          </div>
          <div className="card">
            <h2>{t('license_file')}</h2>
            <p className="sub" style={{ margin: '0 0 10px' }}>{t('license_hint')}</p>
            <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={onPick} hidden />
            {p.licenseFile && safeUrl(p.licenseFile.dataUrl) ? (
              <div className="viewer">{p.licenseFile.type === 'application/pdf' ? <iframe title={p.licenseFile.name} src={p.licenseFile.dataUrl} /> : <img src={p.licenseFile.dataUrl} alt={p.licenseFile.name} />}</div>
            ) : <div className="viewer state"><Icon name="file" size={34} /><div>{t('license_none')}</div></div>}
            <div className="btn-row">
              <button type="button" className="btn o" onClick={() => fileInput.current?.click()}><Icon name="upload" size={16} />{t('license_upload')}</button>
              {p.licenseFile && <button type="button" className="btn s o dg" onClick={removeFile}>{t('license_remove')}</button>}
            </div>
            <h2 style={{ marginTop: 22 }}>{t('map_title')}</h2>
            <MapArt height={190} />
            <p className="sub" style={{ margin: '10px 0 0' }}><Icon name="mapPin" size={15} /> {t('map_note')}</p>
          </div>
        </div>
      )}</Async>
    </section>
  );
}
