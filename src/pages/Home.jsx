
import Navbar from "../components/home/Navbar";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import ServicesSection from "../components/home/ServicesSection";
import HowItWorks from "../components/home/HowItWorks";

import Footer from "../components/home/Footer";  
import HelpDesk from "../components/home/HelpDesk";



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
