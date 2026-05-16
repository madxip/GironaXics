export const revalidate = 3600; // revalida cada hora

import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Filtres from '@/components/Filtres';
import Destacades from '@/components/Destacades';
import Categories from '@/components/Categories';
import ComFunciona from '@/components/ComFunciona';
import BannerCentres from '@/components/BannerCentres';
import Footer from '@/components/Footer';
import { getActivitats } from '@/lib/airtable';

export default async function Home() {
  const activitats = await getActivitats();
  return (
    <>
      <Nav />
      <Hero />
      <Stats />
      
      <div className="editorial-sep">
        <div className="sep-num">01 · FILTRES</div>
        <div className="sep-line"></div>
      </div>
      <Filtres activitats={activitats} />
      
      <div className="editorial-sep">
        <div className="sep-num">02 · EL NOSTRE RECULL</div>
        <div className="sep-line"></div>
      </div>
      <Destacades />
      
      <Categories activitats={activitats} />
      <ComFunciona />
      <BannerCentres />
      <Footer />
    </>
  );
}
