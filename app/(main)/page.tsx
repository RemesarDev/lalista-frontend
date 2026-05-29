// app/(main)/page.tsx
import HeroInfo from '../_components/landing/HeroInfo';
import FeatureCards from '../_components/landing/FeatureCards';

export default function Home() {
  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {/* Explicación principal del motor de precios */}
      <HeroInfo />
      
      {/* Pasos / Características del servicio */}
      <FeatureCards />
    </div>
  );
}