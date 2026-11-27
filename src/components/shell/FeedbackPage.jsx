// صفحة التقييمات: المريض يقيّم أطباءه ومعامله بعد الزيارة، وكل الأدوار تقيّم المنصة
import { useState } from 'react';
import { Async } from '../ui/States.jsx';
import Stars from '../ui/Stars.jsx';
import { useAsync } from '../ui/hooks.js';
import { useToast } from '../ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as api from '../../api/reviews.js';

const TONE = { pending: 'wn', approved: 'ok', rejected: 'dg' };

function ProviderCard({ item, onDone }) {
  const { t, fmtDay } = useI18n();
  const { act, toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!rating) return toast(t('fb_pick_stars'));
    setBusy(true);
    const r = await act(() => api.rateProvider({ bookingId: item.bookingId, rating, comment }));
    setBusy(false);
    if (r) { toast(t('fb_sent')); onDone(r); }
  };
  return (
    <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div><b>{item.providerName}</b> <span className="badge">{t(item.kind === 'lab' ? 'fb_lab' : 'fb_doctor')}</span> <small>{t('fb_visit')}: {fmtDay ? fmtDay(item.date) : item.date}</small></div>
      <Stars value={rating} onChange={setRating} label={t('fb_stars')} />
      <textarea rows={2} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('fb_comment_ph')} />
      <div><button type="button" className="btn s" disabled={busy} onClick={send}>{t('fb_send')}</button></div>
    </div>
  );
}

function ProviderReviews() {
  const { t } = useI18n();
  const state = useAsync(() => api.getMyProviderReviews(), []);
  return (
    <Async state={state}>{(d) => (
      <>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>{t('fb_rate_providers')}</h2>
          <p className="sub">{t('fb_rate_providers_sub')}</p>
          {d.toRate.length === 0 ? <div className="state">{t('fb_none_to_rate')}</div> : d.toRate.map((it) => (
            <ProviderCard key={it.bookingId} item={it} onDone={(r) => state.setData((x) => ({ toRate: x.toRate.filter((y) => y.bookingId !== it.bookingId), mine: [r, ...x.mine] }))} />
          ))}
        </div>
        {d.mine.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h2>{t('fb_mine')}</h2>
            {d.mine.map((r) => (
              <div className="row" key={r.id}>
                <div className="m"><b>{r.targetName}</b><Stars value={r.rating} size={16} />{r.comment && <small>{r.comment}</small>}</div>
                <span className={`badge ${TONE[r.status]}`}>{t(`fb_st_${r.status}`)}</span>
              </div>
            ))}
          </div>
        )}
      </>
    )}</Async>
  );
}

function PlatformReview() {
  const { t } = useI18n();
  const { act, toast } = useToast();
  const state = useAsync(() => api.getMyPlatformReview(), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const cur = state.data;
  const f = form || { rating: cur?.rating || 0, comment: cur?.comment || '' };
  const save = async () => {
    if (!f.rating) return toast(t('fb_pick_stars'));
    setBusy(true);
    const r = await act(() => api.savePlatformReview(f));
    setBusy(false);
    if (r) { state.setData(r); setForm(null); toast(t('fb_sent')); }
  };
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>{t('fb_platform')}</h2>
      <p className="sub">{t('fb_platform_sub')}</p>
      <Async state={state}>{() => (
        <>
          <Stars value={f.rating} onChange={(n) => setForm({ ...f, rating: n })} size={28} label={t('fb_stars')} />
          <textarea rows={3} maxLength={500} value={f.comment} onChange={(e) => setForm({ ...f, comment: e.target.value })} placeholder={t('fb_comment_ph')} style={{ marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn" disabled={busy} onClick={save}>{cur ? t('fb_update') : t('fb_send')}</button>
            {cur && <span>{t('fb_your_status')}: <span className={`badge ${TONE[cur.status]}`}>{t(`fb_st_${cur.status}`)}</span></span>}
          </div>
        </>
      )}</Async>
    </div>
  );
}

export default function FeedbackPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <section>
      <h1>{t('fb_title')}</h1>
      <p className="sub">{t('fb_sub')}</p>
      {user?.role === 'patient' && <ProviderReviews />}
      <PlatformReview />
    </section>
  );
}
