export const revalidate = 60; // revalida cada minut en segon pla

import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Filtres from '@/components/Filtres';
import Destacades from '@/components/Destacades';
import Categories from '@/components/Categories';
import ComFunciona from '@/components/ComFunciona';
import BannerCentres from '@/components/BannerCentres';
import Footer from '@/components/Footer';
import { getActivitats, getCentres, getSponsors, getCasalsBanner } from '@/lib/airtable';
import type { Activitat } from '@/lib/types';
import { Suspense } from 'react';

export default async function Home() {
  const [activitats, centres, sponsors, casalsBanner] = await Promise.all([
    getActivitats(),
    getCentres(),
    getSponsors(),
    getCasalsBanner()
  ]);

  // Derivem les destacades de les activitats ja carregades per evitar una crida duplicada a Airtable
  const destacades = activitats
    .filter((a: Activitat) => a.destacada || a.destacada_gran)
    .sort((a: Activitat, b: Activitat) => (b.destacada_gran ? 1 : 0) - (a.destacada_gran ? 1 : 0));



  const uniqueCategories = new Set(activitats.map((a: Activitat) => a.categoria?.trim()).filter(Boolean));
  const numCategories = uniqueCategories.size;

  return (
    <>
      <Nav />
      <main id="main-content">
      <Hero />
      <Stats numCentres={centres.length} numCategories={numCategories} numActivitats={activitats.length} />

      <div id="filtres" className="editorial-sep">
        <div className="sep-num">01 · FILTRES</div>
        <div className="sep-line"></div>
      </div>
      <Suspense fallback={<div style={{ padding: '0 5vw 80px' }}>Carregant filtres...</div>}>
        <Filtres activitats={activitats} sponsors={sponsors} casalsBanner={casalsBanner} />
      </Suspense>
      
      <div className="editorial-sep">
        <div className="sep-num">02 · EL NOSTRE RECULL</div>
        <div className="sep-line"></div>
      </div>
      <Destacades destacades={destacades} all={activitats} />
      
      <div id="categories" className="editorial-sep">
        <div className="sep-num">03 · CATEGORIES</div>
        <div className="sep-line"></div>
      </div>
      <Categories activitats={activitats} />

      <div className="editorial-sep">
        <div className="sep-num">04 · COM FUNCIONA</div>
        <div className="sep-line"></div>
      </div>
      <ComFunciona />

      <BannerCentres />
      </main>
      <Footer />
    </>
  );
}
