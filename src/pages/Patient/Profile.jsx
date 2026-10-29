import { useApp } from '../../context/AppContext.jsx';

export default function Profile() {
  const { t } = useApp();
  const rows = [
    ['name', t('full_name')],
    ['age', t('age_val')],
    ['blood', 'O+'],
    ['height_weight', t('height_weight_val')],
  ];
  return (
    <section>
      <h1>{t('profile')}</h1>
      <p className="sub">{t('profile_sub')}</p>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="profile-head">
          <div className="av big">{t('full_name').charAt(0)}</div>
          <b>{t('full_name')}</b>
        </div>
        {rows.map(([k, v]) => (
          <div className="row" key={k}>
            <span className="m">{t(k)}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
