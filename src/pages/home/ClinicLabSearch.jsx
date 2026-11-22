import { useNavigate } from 'react-router-dom';
import HomeShell from '../../components/home/HomeShell.jsx';
import Navbar from '../../components/home/Navbar.jsx';
import Footer from '../../components/home/Footer.jsx';
import PlaceSearch from '../../components/home/PlaceSearch.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const PENDING_KEY = 'shefaa_pending_booking';

function Content() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const book = (p) => {
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch { /* ignore */ }
    nav('/patient/booking', { state: { selectedDoctor: p } });   // لو مش مسجل دخول هيروح لصفحة الدخول ويرجع هنا
  };
  return (
    <main className="sec"><div className="wrap">
      <PlaceSearch onPick={book} note={!user ? <p className="sec-sub" style={{ fontSize: 13 }}>{t('sr_login_note')}</p> : null} />
    </div></main>
  );
}
export default function ClinicLabSearch() {
  return <HomeShell><Navbar /><Content /><Footer /></HomeShell>;
}
