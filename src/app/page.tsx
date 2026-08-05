export const revalidate = 60;

import { Metadata } from 'next';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Filtres from '@/components/Filtres';
import Destacades from '@/components/Destacades';
import Categories from '@/components/Categories';
import ComFunciona from '@/components/ComFunciona';
import BannerCentres from '@/components/BannerCentres';
import BannerPartners from '@/components/BannerPartners';
import Footer from '@/components/Footer';
import FloatingMobileFilterBar from '@/components/FloatingMobileFilterBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getActivitats, getCentres, getSponsors, getCasalsBanner } from '@/lib/airtable';
import type { Activitat } from '@/lib/types';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const [activitats, centres] = await Promise.all([
    getActivitats(),
    getCentres(),
  ]);

  const title = "GironaXics | Extraescolars, casals i activitats a Girona";
  const description = `M\u00e9s de ${activitats.length} activitats per a nens de 2 a 18 anys a Girona i comarques a ${centres.length} centres. Gratu\u00eft per a les fam\u00edlies. En catal\u00e0.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'GironaXics',
      url: 'https://gironaxics.cat',
      locale: 'ca_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GironaXics",
    "alternateName": ["Girona Xics", "GironaXics.cat"],
    "url": "https://gironaxics.cat",
    "description": `M\u00e9s de ${activitats.length} activitats per a nens de 2 a 18 anys a Girona i comarques a ${centres.length} centres. Gratu\u00eft per a les fam\u00edlies. En catal\u00e0.`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Nav />
      <main id="main-content" className="home-main-layout">
        <div className="home-hero-wrap">
          <Hero numCentres={centres.length} numCategories={numCategories} numActivitats={activitats.length} />
        </div>

        <div className="home-filtres-wrap">
          <div id="filtres" className="editorial-sep">
            <div className="sep-num">01 · FILTRES</div>
            <div className="sep-line"></div>
          </div>
          <Suspense fallback={
            <div style={{
              padding: '0 5vw 80px',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              opacity: 0.6
            }}>
              <div style={{ height: '45px', backgroundColor: '#eae6df', borderRadius: '30px', width: '200px' }}></div>
              <div style={{ height: '120px', backgroundColor: '#e2dfd5', borderRadius: '12px' }}></div>
            </div>
          }>
            <Filtres activitats={activitats} sponsors={sponsors} casalsBanner={casalsBanner} />
          </Suspense>
        </div>

        <div className="home-rest-wrap">
          <div className="editorial-sep">
            <div className="sep-num">02 · ACTIVITATS DESTACADES</div>
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
        </div>
      </main>
      <FloatingMobileFilterBar />
      <MobileBottomNav />
      <Footer />
    </>
  );
}
