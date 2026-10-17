import "../App.css";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ServicesSection from "../components/ServicesSection";
import HowItWorks from "../components/HowItWorks";

import Footer from "../components/Footer";  
import HelpDesk from "../components/HelpDesk";
import Specialists from "../components/Specialists"



function Home() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <HowItWorks />
        
        <Specialists/>
        <HelpDesk/>
      </main>

      <Footer />
    </>
  );
}

export default Home;
