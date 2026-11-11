import HomeShell from '../../components/home/HomeShell.jsx';
import Navbar from '../../components/home/Navbar.jsx';
import HeroSection from '../../components/home/HeroSection.jsx';
import ServicesSection from '../../components/home/ServicesSection.jsx';
import AboutSection from '../../components/home/AboutSection.jsx';
import HowItWorks from '../../components/home/HowItWorks.jsx';
import HelpDesk from '../../components/home/HelpDesk.jsx';
import Footer from '../../components/home/Footer.jsx';

export default function Home() {
  return (
    <HomeShell>
      <Navbar />
      <main><HeroSection /><ServicesSection /><AboutSection /><HowItWorks /><HelpDesk /></main>
      <Footer />
    </HomeShell>
  );
}
