import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/patient.js';

const CHIPS = ['sym_chip_headache', 'sym_chip_fever', 'sym_chip_chest', 'sym_chip_cough', 'sym_chip_stomach', 'sym_chip_dizzy', 'sym_chip_back', 'sym_chip_throat'];

// نقرأ الموقع مرة واحدة (اختياري) ولا نحفظه
const getPosition = () => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve(null);
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => resolve(null),
    { timeout: 8000, maximumAge: 300000 },
  );
});

export default function SymptomTriage() {
  const { t, L, lang, num } = useI18n();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [near, setNear] = useState(false);
  const top = useRef(null);

  const sep = lang === 'ar' ? '، ' : ', ';
  const addChip = (k) => setText((p) => (p.trim() ? `${p.trim()}${sep}${t(k)}` : t(k)));

  const run = async (value) => {
    if (!value.trim()) return toast(t('sym_empty'));
    setBusy(true);
    try {
      let pos = null;
      if (near) { pos = await getPosition(); if (!pos) toast(t('sym_loc_denied')); }
      const r = await api.triage(value, pos);
      setRes(r);
      setTimeout(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      toast(e?.status === 429 ? t('sym_limit') : t('error'));
    } finally { setBusy(false); }
  };

  // الإجابة على سؤال توضيحي: نضيفها للنص ونعيد التحليل
  const answer = (q, o) => {
    const next = `${text.trim()}${text.trim() ? '. ' : ''}${L(q)}: ${L(o)}`;
    setText(next);
    run(next);
  };

  const reset = () => { setText(''); setRes(null); };

  const docsOf = (specId) => (res?.doctors || []).filter((d) => d.matchedSpecialty === specId);

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
        <label className="tri-near"><input type="checkbox" checked={near} onChange={(e) => setNear(e.target.checked)} /> {t('sym_near_on')}</label>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => run(text)} disabled={busy}><Icon name="bot" size={18} />{busy ? t('loading') : t('sym_analyze')}</button>
          {res && <button type="button" className="btn o" onClick={reset} disabled={busy}>{t('sym_new')}</button>}
        </div>
      </div>

      {res && (
        <div ref={top} style={{ scrollMarginTop: 12 }}>
          {res.emergency && (
            <div className="tri-emerg" role="alert">
              <Icon name="alert" size={22} />
              <div><b>{t('sym_emerg_title')}</b><p>{L(res.advice)}</p></div>
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <div className="tri-head">
              <h2>{t('sym_result_title')}</h2>
              <span className="badge mu">{t(res.source === 'ai' ? 'sym_src_ai' : 'sym_src_rules')}</span>
            </div>
            <div className="row">
              <div className="res-icon"><Icon name="bot" size={22} /></div>
              <div className="m"><b>{L(res.summary)}</b><small>{t('sym_severity')}: <span className={`sev ${res.severity}`}>{t(`sev_${res.severity}`)}</span></small></div>
            </div>
            {!res.emergency && res.advice && (
              <div className="tri-advice"><b>{t('sym_advice')}</b><p>{L(res.advice)}</p></div>
            )}
          </div>

          {res.questions?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h2>{t('sym_q_title')}</h2>
              <p className="sub" style={{ margin: '0 0 10px' }}>{t('sym_q_hint')}</p>
              {res.questions.map((q, i) => (
                <div key={i} className="tri-q">
                  <b>{L(q)}</b>
                  <div className="chips">
                    {q.opts.map((o, k) => <button type="button" key={k} className="chip" disabled={busy} onClick={() => answer(q, o)}>{L(o)}</button>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {res.tests?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h2>{t('sym_tests_title')}</h2>
              <p className="sub" style={{ margin: '0 0 6px' }}>{t('sym_tests_note')}</p>
              {res.tests.map((x) => (
                <div className="tri-spec" key={x.ar}>
                  <div className="tri-spec-h">
                    <Icon name={x.kind === 'xray' ? 'scan' : 'flask'} size={18} />
                    <b>{L(x)}</b>
                    <span className="badge mu">{t(x.kind === 'xray' ? 'sym_kind_xray' : 'sym_kind_lab')}</span>
                  </div>
                  {x.labs.length === 0 ? <div className="sub tri-none">{t('sym_no_labs')}</div> : x.labs.map((l) => (
                    <div className="row" key={l.id}>
                      <div className="av">{L(l.name).charAt(0)}</div>
                      <div className="m">
                        <b>{L(l.name)}</b>
                        <small>{L(l.address)}{l.distanceKm != null ? ` · ${num(l.distanceKm)} ${t('sym_dist')}` : ''}</small>
                      </div>
                      <Link className="btn s" to="/patient/booking" state={{ selectedDoctor: l, test: x.ar }}>{t('sym_book_one')}</Link>
                    </div>
                  ))}
                  {x.labCount > x.labs.length && <small className="sub">{t('sym_more_labs').replace('{n}', num(x.labCount - x.labs.length))}</small>}
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t('sym_specs_title')}</h2>
            {res.specialties.map((s, i) => (
              <div className="tri-spec" key={s.id}>
                <div className="tri-spec-h">
                  <b>{L(s)}</b>
                  {i === 0 && <span className="badge ok">{t('sym_best')}</span>}
                </div>
                {s.reason && L(s.reason) && <small className="sub">{L(s.reason)}</small>}
                {docsOf(s.id).length === 0 ? <div className="sub tri-none">{t('sym_no_docs')}</div> : docsOf(s.id).map((d) => (
                  <div className="row" key={d.id}>
                    <div className="av">{L(d.name).replace(/^(د\.|Dr\.)\s*/, '').charAt(0)}</div>
                    <div className="m">
                      <b>{L(d.name)}</b>
                      <small>
                        {d.clinic ? `${d.clinic} · ` : ''}{L(d.address)}
                        {d.distanceKm != null ? ` · ${num(d.distanceKm)} ${t('sym_dist')}` : ''}
                      </small>
                    </div>
                    <Link className="btn s" to="/patient/booking" state={{ selectedDoctor: d }}>{t('sym_book_one')}</Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
