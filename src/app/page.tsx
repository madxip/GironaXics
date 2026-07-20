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



  const uniqueCategories = new Set<string>();
  activitats.forEach((a: Activitat) => {
    const cats = a.categories || [a.categoria];
    cats.forEach((c: string) => { if (c?.trim()) uniqueCategories.add(c.trim()); });
  });
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
      <Suspense fallback={
        <div style={{
          padding: '0 5vw 80px',
          minHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          opacity: 0.6
        }}>
          <style>{`
            .grid-placeholder {
              display: grid;
              grid-template-columns: repeat(12, 1fr);
              gap: 32px;
            }
            @media (max-width: 768px) {
              .grid-placeholder {
                display: flex !important;
                flex-direction: column !important;
                gap: 20px;
              }
            }
          `}</style>
          
          {/* Tabs Placeholder */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '180px', height: '45px', backgroundColor: '#e2dfd5', borderRadius: '30px' }}></div>
            <div style={{ width: '180px', height: '45px', backgroundColor: '#eae6df', borderRadius: '30px' }}></div>
          </div>
          
          {/* Main Grid Placeholder */}
          <div className="grid-placeholder">
            {/* Sidebar Placeholder */}
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ width: '150px', height: '24px', backgroundColor: '#e2dfd5', borderRadius: '4px' }}></div>
              <div style={{ height: '45px', backgroundColor: '#eae6df', borderRadius: '4px' }}></div>
              <div style={{ height: '45px', backgroundColor: '#eae6df', borderRadius: '4px' }}></div>
              <div style={{ height: '45px', backgroundColor: '#eae6df', borderRadius: '4px' }}></div>
            </div>
            
            {/* Results Placeholder */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '250px', height: '28px', backgroundColor: '#e2dfd5', borderRadius: '4px', marginBottom: '16px' }}></div>
              <div style={{ height: '50px', backgroundColor: '#eae6df', borderRadius: '8px' }}></div>
              <div style={{ height: '50px', backgroundColor: '#eae6df', borderRadius: '8px' }}></div>
              <div style={{ height: '50px', backgroundColor: '#eae6df', borderRadius: '8px' }}></div>
              <div style={{ height: '50px', backgroundColor: '#eae6df', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
      }>
        <Filtres activitats={activitats} centres={centres} sponsors={sponsors} casalsBanner={casalsBanner} />
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
