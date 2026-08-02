import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SpreadsheetEmbed from '@/components/SpreadsheetEmbed';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
