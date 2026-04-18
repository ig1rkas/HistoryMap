import Header from './components/Header';
import HeroContent from './components/HeroContent';
import MapSection from './components/MapSection';

export default function App() {
  return (
    <div className="page">
      <div className="page__right-gradient" />

      <div className="container">
        <Header />

        <main className="hero">
          <HeroContent />
          <MapSection />
        </main>
      </div>
    </div>
  );
}