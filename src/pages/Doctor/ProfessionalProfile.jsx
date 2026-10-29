import { useEffect, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext.jsx';

const KEY = 'doctor-license-file';
const MAX = 3 * 1024 * 1024; // 3MB

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

export default function ProfessionalProfile() {
  const { t, toast } = useDoctor();
  const fileInput = useRef(null);
  const [file, setFile] = useState(readStored); // { name, type, dataUrl }
  const [blobUrl, setBlobUrl] = useState('');
  const [form, setForm] = useState({
    license: 'EG-2014-58231',
    specialty: 'sp_internal',
    clinic: t('clinic_name_v'),
    address: t('address_v'),
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // نحوّل الملف إلى Blob URL للعرض (يعمل مع الـ PDF أفضل من data URL)
  useEffect(() => {
    if (!file) return setBlobUrl('');
    let url = '';
    let alive = true;
    fetch(file.dataUrl)
      .then((r) => r.blob())
      .then((b) => {
        url = URL.createObjectURL(b);
        if (alive) setBlobUrl(url);
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) return toast(t('license_bad'));
    if (f.size > MAX) return toast(t('license_big'));
    const reader = new FileReader();
    reader.onload = () => {
      const next = { name: f.name, type: f.type, dataUrl: reader.result };
      setFile(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* too large or storage unavailable */
      }
      // TODO: ارفع الملف إلى الـ API/التخزين السحابي
      toast(t('license_saved'));
    };
    reader.readAsDataURL(f);
  };

  const remove = () => {
    setFile(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <section>
      <h1>{t('prof_title')}</h1>
      <p className="d-sub">{t('prof_sub')}</p>

      <div className="d-grid d-g2">
        <div className="d-card">
          <div className="d-row" style={{ border: 0 }}>
            <div className="d-av big">أ</div>
            <div className="d-m">
              <b style={{ fontSize: 18 }}>{t('doctor_name')}</b>
              <small>{t('doctor_role')}</small>
            </div>
            <span className="d-badge ok">{t('licensed')}</span>
          </div>

          <label>{t('license_no')}</label>
          <input value={form.license} onChange={set('license')} dir="ltr" />
          <label>{t('specialty')}</label>
          <select value={form.specialty} onChange={set('specialty')}>
            <option value="sp_internal">{t('sp_internal')}</option>
            <option value="sp_cardio">{t('sp_cardio')}</option>
            <option value="sp_neuro">{t('sp_neuro')}</option>
          </select>
          <label>{t('clinic_name')}</label>
          <input value={form.clinic} onChange={set('clinic')} />
          <label>{t('address')}</label>
          <input value={form.address} onChange={set('address')} />
          <br /><br />
          <button className="d-btn" onClick={() => toast(t('saved_prof'))}>{t('save')}</button>
        </div>

        <div className="d-card">
          <h2>{t('license_file')}</h2>
          <p className="d-sub" style={{ margin: '0 0 10px' }}>{t('license_hint')}</p>

          <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={onPick} hidden />

          {file && blobUrl ? (
            <div className="d-viewer">
              {isPdf ? (
                <iframe title={file.name} src={blobUrl} />
              ) : (
                <img src={blobUrl} alt={file.name} />
              )}
            </div>
          ) : (
            <div className="d-viewer empty">
              <FileText size={34} />
              <span>{t('license_none')}</span>
            </div>
          )}

          <div className="d-inline" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <button className="d-btn o" onClick={() => fileInput.current?.click()}>
              <Upload size={15} style={{ verticalAlign: '-2px' }} /> {t('license_upload')}
            </button>
            {file && blobUrl && (
              <>
                <a className="d-btn o" href={blobUrl} target="_blank" rel="noreferrer">{t('license_open')}</a>
                <button className="d-btn dg s" onClick={remove}>{t('license_remove')}</button>
              </>
            )}
          </div>

          <h2 style={{ marginTop: 22 }}>{t('map_title')}</h2>
          <div className="d-map">
            <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
              <path d="M0 120 L400 70" stroke="#fff" strokeWidth="14" />
              <path d="M150 0 L210 200" stroke="#fff" strokeWidth="10" />
              <path d="M0 40 L300 200" stroke="#fff" strokeWidth="6" />
              <rect x="240" y="100" width="60" height="40" rx="6" fill="#d7e5f8" />
              <rect x="40" y="130" width="70" height="50" rx="6" fill="#d7e5f8" />
              <path d="M200 60 a14 14 0 1 1 .1 0 l-.1 0 -14 28 z" fill="#2563eb" transform="translate(0 -6)" />
              <circle cx="200" cy="56" r="5" fill="#fff" />
            </svg>
          </div>
          <p className="d-sub" style={{ margin: '10px 0 0' }}>{t('map_note')}</p>
        </div>
      </div>
    </section>
  );
}
