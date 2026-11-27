import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Async } from '../../components/ui/States.jsx';
import { useAsync } from '../../components/ui/hooks.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import * as api from '../../api/admin.js';

const COLORS = [['pageBg', 'adm_ed_pagebg'], ['cardBg', 'adm_ed_cardbg'], ['brandColor', 'adm_ed_brand'], ['textColor', 'adm_ed_text'], ['footerColor', 'adm_ed_footer']];
const KEYS = ['brandName', 'showBrandName', 'logoWidth', 'pageBg', 'cardBg', 'brandColor', 'textColor', 'footerColor', 'fontSize', 'radius', 'footerAr', 'footerEn'];

function Editor({ initial, onSaved }) {
  const { t } = useI18n();
  const { act, toast } = useToast();
  const [f, setF] = useState(() => Object.fromEntries(KEYS.map((k) => [k, initial[k]])));
  const [d, setD] = useState(initial); // الحالة المحفوظة (الشعار)
  const [lang, setLang] = useState('ar');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // معاينة حية بنفس قالب الإرسال الفعلي
  useEffect(() => {
    const id = setTimeout(async () => {
      try { const r = await api.previewEmailDesign(f, lang); setHtml(r.html || ''); } catch { /* تجاهل */ }
    }, 300);
    return () => clearTimeout(id);
  }, [f, lang, d.hasLogo]);

  const save = async () => {
    setBusy(true);
    const r = await act(() => api.saveEmailDesign(f));
    setBusy(false);
    if (r) { setD(r); toast(t('adm_ed_saved')); }
  };
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    const r = await act(() => api.uploadEmailLogo(file));
    setBusy(false);
    if (r) { setD(r); toast(t('adm_ed_logo_ok')); }
  };
  const dropLogo = async () => {
    setBusy(true);
    const r = await act(() => api.removeEmailLogo());
    setBusy(false);
    if (r) { setD(r); toast(t('adm_ed_logo_removed')); }
  };
  const test = async () => {
    setBusy(true);
    const r = await act(() => api.testEmailDesign());
    setBusy(false);
    if (r) toast(t('adm_ed_test_ok'));
  };
  const reset = () => setF(Object.fromEntries(KEYS.map((k) => [k, { brandName: 'Shefaa', showBrandName: true, logoWidth: 120, pageBg: '#f4f6fa', cardBg: '#ffffff', brandColor: '#1d4ed8', textColor: '#1f2937', footerColor: '#6b7280', fontSize: 15, radius: 12, footerAr: 'هذه رسالة من منصة شفاء الطبية. إذا لم تكن أنت من طلبها فتجاهلها.', footerEn: 'This message was sent by the Shefaa medical platform. If you did not request it, you can ignore it.' }[k]])));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
      <div className="card">
        <label className="first">{t('adm_ed_name')}</label>
        <input value={f.brandName} maxLength={60} onChange={set('brandName')} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.showBrandName} onChange={set('showBrandName')} style={{ width: 'auto' }} />{t('adm_ed_showname')}</label>

        <label>{t('adm_ed_logo')}</label>
        {d.hasLogo && <div style={{ margin: '6px 0' }}><img src={d.logoUrl} alt="" style={{ maxWidth: 160, maxHeight: 80, background: '#fff', border: '1px solid var(--bd)', borderRadius: 8, padding: 6 }} /></div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn s o" type="button" disabled={busy} onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> {d.hasLogo ? t('adm_ed_logo_change') : t('adm_ed_logo_add')}</button>
          {d.hasLogo && <button className="btn s dg" type="button" disabled={busy} onClick={dropLogo}><Icon name="trash" size={14} /> {t('adm_ed_logo_remove')}</button>}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pick} />
        </div>
        <small>{t('adm_ed_logo_hint')}</small>
        <label>{t('adm_ed_logo_w')}: {f.logoWidth}px</label>
        <input type="range" min="40" max="300" value={f.logoWidth} onChange={set('logoWidth')} />

        <h3 style={{ marginTop: 18 }}>{t('adm_ed_colors')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {COLORS.map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="color" value={f[k]} onChange={set(k)} style={{ width: 40, height: 32, padding: 0 }} />{t(label)}
            </label>
          ))}
        </div>
        <label>{t('adm_ed_fs')}: {f.fontSize}px</label>
        <input type="range" min="12" max="20" value={f.fontSize} onChange={set('fontSize')} />
        <label>{t('adm_ed_radius')}: {f.radius}px</label>
        <input type="range" min="0" max="30" value={f.radius} onChange={set('radius')} />

        <label>{t('adm_ed_footer_ar')}</label>
        <textarea rows={2} maxLength={300} value={f.footerAr} onChange={set('footerAr')} />
        <label>{t('adm_ed_footer_en')}</label>
        <textarea rows={2} maxLength={300} dir="ltr" value={f.footerEn} onChange={set('footerEn')} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <button className="btn" type="button" disabled={busy} onClick={save}>{t('adm_ed_save')}</button>
          <button className="btn o" type="button" disabled={busy} onClick={test}><Icon name="mail" size={14} /> {t('adm_ed_test')}</button>
          <button className="btn o" type="button" disabled={busy} onClick={reset}>{t('adm_ed_reset')}</button>
        </div>
        <small>{t('adm_ed_test_hint')}</small>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <b>{t('adm_ed_preview')}</b>
          <div className="tabs" style={{ margin: 0 }}>
            <button type="button" className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>العربية</button>
            <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>
        </div>
        <iframe title="preview" sandbox="" srcDoc={html} style={{ width: '100%', height: 460, border: '1px solid var(--bd)', borderRadius: 8, background: '#fff' }} />
      </div>
    </div>
  );
}

export default function EmailDesign() {
  const { t } = useI18n();
  const state = useAsync(() => api.getEmailDesign(), []);
  return (
    <section>
      <h1>{t('adm_ed_title')}</h1>
      <p className="sub">{t('adm_ed_sub')}</p>
      <Async state={state}>{(d) => <Editor initial={d} />}</Async>
    </section>
  );
}
