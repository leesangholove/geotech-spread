import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SpreadsheetEmbed from '@/components/SpreadsheetEmbed';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <SpreadsheetEmbed />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

export default App;
