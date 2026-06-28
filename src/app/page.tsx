export const revalidate = 86400; // revalida cada 24h (les Server Actions fan revalidatePath quan hi ha canvis)

import { Metadata } from 'next';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Filtres from '@/components/Filtres';
import Destacades from '@/components/Destacades';
import Categories from '@/components/Categories';
import ComFunciona from '@/components/ComFunciona';
import BannerCentres from '@/components/BannerCentres';
import BannerPartners from '@/components/BannerPartners';
import Footer from '@/components/Footer';
import { getActivitats, getCentres, getSponsors, getCasalsBanner } from '@/lib/airtable';
import type { Activitat } from '@/lib/types';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const [activitats, centres] = await Promise.all([
    getActivitats(),
    getCentres(),
  ]);

  return {
    description: `M\u00e9s de ${activitats.length} activitats per a nens de 2 a 18 anys a Girona i comarques a ${centres.length} centres. Gratu\u00eft per a les fam\u00edlies. En catal\u00e0.`,
  };
}

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
      <BannerPartners />
      </main>
      <Footer />
    </>
  );
}
