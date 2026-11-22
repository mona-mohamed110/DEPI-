import HomeShell from '../home/HomeShell.jsx';
import Navbar from '../home/Navbar.jsx';
import { authDict } from '../../i18n/auth.js';
import '../../styles/auth.css';

// غلاف صفحات الدخول (النافبار + بطاقة في النص)
export default function AuthPage({ children }) {
  return (
    <HomeShell dict={authDict} className="auth-app">
      <Navbar />
      <main className="auth-main"><div className="auth-card">{children}</div></main>
    </HomeShell>
  );
}
