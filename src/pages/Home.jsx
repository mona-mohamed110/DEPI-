import "../App.css";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ServicesSection from "../components/ServicesSection";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <HowItWorks />
      </main>

      <Footer />
    </>
  );
}

export default Home;
