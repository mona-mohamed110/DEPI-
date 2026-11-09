import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import FileView from '../../components/shell/FileView.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/doctor.js';

// الدكتور يختار مريض من اللي مدّوه إذن، فيظهر ملفه الكامل (للقراءة فقط) في نفس الصفحة
export default function PatientFile() {
  const { t, L, num } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const id = params.get('p') || '';
  const pts = useAsync(() => api.getPatients(), []);
  const file = useAsync(() => (id ? api.getPatientFile(id) : Promise.resolve(null)), [id]);

  return (
    <section>
      <div className="page-head">
        <div><h1>{t('rec_title')}</h1><p className="sub">{t('rec_sub')}</p></div>
        {id && <button type="button" className="btn" onClick={() => nav(`/doctor/exam?p=${id}`)}><Icon name="clipboardPlus" size={18} />{t('add_rx')}</button>}
      </div>

      <Async state={pts}>{(list) => (list.length === 0 ? <div className="card state">{t('no_patients')}<br /><small>{t('no_patients_hint')}</small></div> : (
        <div className="card">
          <h2>{t('rec_pick')}</h2>
          <div className="pt-pick">
            {list.map((p) => (
              <button type="button" key={p.id} className={`pt-chip ${id === p.id ? 'on' : ''}`} aria-pressed={id === p.id} onClick={() => setParams({ p: p.id })}>
                <span className="av">{L(p.name).charAt(0)}</span>
                <span><b>{L(p.name)}</b><small>{p.age != null ? `${num(p.age)} ${t('years')}` : ''}</small></span>
              </button>
            ))}
          </div>
        </div>
      ))}</Async>

      {id && (
        <div style={{ marginTop: 16 }}>
          {file.error ? <div className="card state err">{t(`err_${file.error.code}`) !== `err_${file.error.code}` ? t(`err_${file.error.code}`) : t('error')}</div>
            : <Async state={file}>{(f) => (f ? <FileView file={f} /> : null)}</Async>}
        </div>
      )}
      {!id && !pts.loading && pts.data?.length > 0 && <p className="sub" style={{ marginTop: 16 }}>{t('rec_pick_hint')}</p>}
    </section>
  );
}
