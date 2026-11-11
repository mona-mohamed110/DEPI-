import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { safeUrl } from '../../api/security.js';
import * as api from '../../api/patient.js';

const ICON = { lab: 'tube', xray: 'scan', ecg: 'activity' };
const TONE = { normal: ['ok', 'res_normal'], low: ['wn', 'res_low'], followup: ['dg', 'res_followup'] };

export default function Results() {
  const { t, L, fmtDate } = useI18n();
  const { toast } = useToast();
  const state = useAsync(() => api.getResults(), []);
  return (
    <section>
      <h1>{t('res_title')}</h1>
      <p className="sub">{t('res_sub')}</p>
      <div className="card">
        <Async state={state}>{(list) => list.length === 0 ? <div className="state">{t('no_results')}</div> : list.map((r) => {
          const url = safeUrl(r.fileUrl);
          const [tone, label] = TONE[r.status] || TONE.normal;
          return (
            <div className="row" key={r.id}>
              <div className="res-icon"><Icon name={ICON[r.kind] || 'file'} size={22} /></div>
              <div className="m"><b>{L(r.title)}</b><small>{L(r.source)} · {fmtDate(r.date)}</small></div>
              <span className={`badge ${tone}`}>{t(label)}</span>
              {url ? <a className="btn s o" href={url} target="_blank" rel="noopener noreferrer">{t('view')}</a>
                : <button type="button" className="btn s o" onClick={() => toast(t('res_nofile'))}>{t('view')}</button>}
            </div>
          );
        })}</Async>
      </div>
    </section>
  );
}
