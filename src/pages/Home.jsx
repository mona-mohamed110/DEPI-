
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ServicesSection from "../components/ServicesSection";
import HowItWorks from "../components/HowItWorks";

import Footer from "../components/Footer";  
import HelpDesk from "../components/HelpDesk";




function Home() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <HowItWorks />
        
      
        <HelpDesk/>
      </main>

      <Footer />
    </>
  );
}

export default Home;
