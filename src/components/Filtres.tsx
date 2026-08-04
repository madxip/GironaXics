"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activitat, Sponsor, CasalsBanner } from '@/lib/types';
import AccordionCategoria from './AccordionCategoria';
import { normalizeSlug, getSessionRandomSeed, getDeterministicSeed } from '@/lib/utils';
import { trackEvent } from '@/lib/trackEvent';
import { isTallerExpiredOrEnded, getNextTallerDate } from '@/lib/tallerDates';



const EDAT_GROUPS = [
  'Totes',
  'De 0 a 2 anys',
  'De 3 a 5 anys',
  'De 6 a 11 anys',
  'De 12 a 18 anys'
];

function matchEdatGroup(edatStr: string | undefined, group: string): boolean {
  if (group === 'Totes') return true;
  if (!edatStr) return false;
  
  const s = edatStr.toLowerCase();
  
  let min: number | null = null;
  let max: number | null = null;

  // Detecta expressions d'edat obertes (sense límit superior):
  // "a partir de X", "des de X", "X anys o més", "X anys en endavant", "majors de X", "+X"
  const isOpenEnded =
    s.includes('partir') ||
    s.includes('des de') ||
    s.includes('o més') ||
    s.includes('en endavant') ||
    s.includes('majors') ||
    /\+\s*\d/.test(s);

  // Només extraiem números si hi ha la paraula "any" o "anys" per evitar
  // confondre el curs "6è" amb "6 anys".
  if (s.includes('any')) {
    const numbers = s.match(/\d+/g)?.map(Number) || [];
    if (numbers.length > 0) {
      min = Math.min(...numbers);
      // Si és una expressió oberta, no hi ha màxim (infinit)
      max = isOpenEnded ? Infinity : Math.max(...numbers);
    }
  }

  if (group === 'De 0 a 2 anys') {
    if (s.includes('nadó') || s.includes('nado') || s.includes('nadons') || s.includes('lactant') || s.includes('bebè') || s.includes('bebe') || s.includes('llar d\'infants')) return true;
    if (min !== null && min <= 2) return true;
    return false;
  }

  if (group === 'De 3 a 5 anys') {
    if (s.includes('infantil') || s.includes('p3') || s.includes('p4') || s.includes('p5')) return true;
    if (min !== null && min <= 5) return true;
    return false;
  }
  
  if (group === 'De 6 a 11 anys') {
    if (s.includes('primària') || s.includes('primaria')) return true;
    if (min !== null && max !== null) {
      if ((min >= 6 && min <= 11) || (max >= 6 && max <= 11) || (min <= 5 && max >= 6)) return true;
    }
    return false;
  }

  if (group === 'De 12 a 18 anys') {
    if (s.includes('eso') || s.includes('batxillerat') || s.includes('jove') || s.includes('joves')) return true;
    // max >= 12 ara funciona correctament per a "A partir de X" perquè max = Infinity
    if (max !== null && max >= 12) return true;
    return false;
  }

  return false;
}

export default function Filtres({ 
  activitats, 
  sponsors = [],
  casalsBanner
}: { 
  activitats: Activitat[], 
  sponsors?: Sponsor[],
  casalsBanner?: CasalsBanner | null
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionSeed, setSessionSeed] = useState<string>('');

  // Carrega o crea la llavor aleatòria única per a la sessió de navegació (sessionStorage)
  useEffect(() => {
    setSessionSeed(getSessionRandomSeed());
  }, []);

  // Restaura la posició de scroll quan es torna d'una fitxa d'activitat
  useEffect(() => {
    const saved = sessionStorage.getItem('gironaxics-scroll');
    if (saved) {
      sessionStorage.removeItem('gironaxics-scroll');
      const targetScroll = parseInt(saved, 10);
      
      // Intent immediat per si el DOM ja té l'alçada
      window.scrollTo(0, targetScroll);
      
      // Intent retardat per donar temps a Next.js a pintar les targetes al DOM
      const timer = setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: 'instant' });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);



  const selectedTipus = searchParams.get('tipus') || 'Extraescolars';
  const selectedCategoria = searchParams.get('categoria') || 'Totes';
  const selectedSubcategoria = searchParams.get('subcategoria') || 'Totes';
  const selectedEdat = searchParams.get('edat') || 'Totes';
  const selectedBarri = searchParams.get('barri') || 'Totes';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'categoria') {
      params.delete('subcategoria'); // Reset subcategory when category changes
    }
    if (value === 'Totes') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });

    // Scroll automàtic cap als resultats només en desktop
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setTimeout(() => {
        const el = document.getElementById('results-container');
        if (el) {
          const offset = 110;
          const y = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 50);
    }

    // Tracking analytics
    if (value !== 'Totes') {
      if (key === 'categoria')    trackEvent('filter_categoria', value);
      else if (key === 'barri')   trackEvent('filter_barri', value);
      else if (key === 'edat')    trackEvent('filter_edat', value);
      else if (key === 'tipus')   trackEvent('filter_tipus', value);
    }
  };




  const handleSponsorClick = (sponsorNom: string) => {
    // Tracking a Airtable
    trackEvent('sponsor_click', sponsorNom, selectedCategoria);

    // Tracking a Google Analytics (si l'usuari ha acceptat cookies)
    interface CustomWindow extends Window {
      gtag?: (
        command: 'event',
        eventName: string,
        eventParams: { event_category: string; event_label: string; category_name: string }
      ) => void;
    }
    if (typeof window !== 'undefined') {
      const cw = window as unknown as CustomWindow;
      if (cw.gtag) {
        cw.gtag('event', 'sponsor_click', {
          event_category: 'Sponsor',
          event_label: sponsorNom,
          category_name: selectedCategoria,
        });
      }
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    
    // Filtrem primer pel tipus de pestanya actual per saber quines categories tenen activitats reals en aquest tipus
    const filteredByTipus = activitats.filter(a => {
      const normalizedTipus = a.tipus?.toLowerCase().trim() || '';
      return selectedTipus === 'Totes' || 
             (selectedTipus === 'Extraescolars' && (normalizedTipus === '' || normalizedTipus.includes('extraescolar'))) ||
             (selectedTipus === 'Casals' && normalizedTipus.includes('casal')) ||
             (selectedTipus === 'Tallers i Oci' && (
               normalizedTipus.includes('taller') || 
               normalizedTipus.includes('oci') || 
               normalizedTipus.includes('monograf') || 
               normalizedTipus.includes('escape') || 
               normalizedTipus.includes('aniversari') || 
               normalizedTipus.includes('virtual')
             ));
    });

    filteredByTipus.forEach(a => {
      const cats = a.categories || [a.categoria];
      cats.forEach((c: string) => { if (c) set.add(c); });
    });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats, selectedTipus]);

  // Si la categoria seleccionada no té cap activitat per al tipus actual (pestanya),
  // reseteja la categoria a 'Totes' per evitar pantalles de "No s'han trobat activitats" innecessàries
  useEffect(() => {
    if (selectedCategoria !== 'Totes' && categories.length > 1) {
      if (!categories.includes(selectedCategoria)) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('categoria');
        params.delete('subcategoria');
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [selectedTipus, categories, selectedCategoria, router, searchParams]);

  const subcategories = useMemo(() => {
    if (selectedCategoria === 'Totes') return ['Totes'];
    const set = new Set<string>();
    activitats.forEach(a => {
      const cats = a.categories || [a.categoria];
      if (cats.includes(selectedCategoria) && a.subcategoria) {
        set.add(a.subcategoria);
      }
    });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats, selectedCategoria]);

  const hasSubcategories = subcategories.length > 1;

  const barris = useMemo(() => {
    const gironaSet = new Set<string>();
    const altresSet = new Set<string>();
    
    // Filtrem primer les activitats segons la pestanya seleccionada (selectedTipus)
    const activeTipusActivitats = activitats.filter(a => {
      const normalizedTipus = a.tipus?.toLowerCase().trim() || '';
      return selectedTipus === 'Totes' || 
             (selectedTipus === 'Extraescolars' && (normalizedTipus === '' || normalizedTipus.includes('extraescolar'))) ||
             (selectedTipus === 'Casals' && normalizedTipus.includes('casal')) ||
             (selectedTipus === 'Tallers i Oci' && (
               normalizedTipus.includes('taller') || 
               normalizedTipus.includes('oci') || 
               normalizedTipus.includes('monograf') || 
               normalizedTipus.includes('escape') || 
               normalizedTipus.includes('aniversari') || 
               normalizedTipus.includes('virtual')
             ));
    });

    activeTipusActivitats.forEach(a => {
      if (!a.barri) return;
      const b = a.barri.trim();
      if (b.startsWith('Girona - ') || b === 'Girona') {
        gironaSet.add(b);
      } else {
        altresSet.add(b);
      }
    });
    return {
      girona: Array.from(gironaSet).sort((a, b) => a.localeCompare(b)),
      altres: Array.from(altresSet).sort((a, b) => a.localeCompare(b))
    };
  }, [activitats, selectedTipus]);

  const filtered = useMemo(() => {
    const result = activitats.filter(a => {
      const normalizedTipus = a.tipus?.toLowerCase().trim() || '';
      const matchTipus = selectedTipus === 'Totes' || 
                         (selectedTipus === 'Extraescolars' && (normalizedTipus === '' || normalizedTipus.includes('extraescolar'))) ||
                         (selectedTipus === 'Casals' && normalizedTipus.includes('casal')) ||
                         (selectedTipus === 'Tallers i Oci' && (
                           normalizedTipus.includes('taller') || 
                           normalizedTipus.includes('oci') || 
                           normalizedTipus.includes('monograf') || 
                           normalizedTipus.includes('escape') || 
                           normalizedTipus.includes('aniversari') || 
                           normalizedTipus.includes('virtual')
                         ));
      const cats = a.categories || [a.categoria];
      const matchCat = selectedCategoria === 'Totes' || cats.includes(selectedCategoria);
      const matchSubcat = selectedCategoria === 'Totes' || selectedSubcategoria === 'Totes' || a.subcategoria === selectedSubcategoria;
      const matchEdat = matchEdatGroup(a.edat, selectedEdat);
      const matchBarri = selectedBarri === 'Totes'
        ? true
        : selectedBarri === 'Girona'
          ? (a.barri?.trim().startsWith('Girona - ') || a.barri?.trim() === 'Girona')
          : a.barri === selectedBarri;
      return matchTipus && matchCat && matchSubcat && matchEdat && matchBarri;
    });
    const filtered = result.filter(a => {
      // Amaga tallers expirats (puntuals acabats o recurrents fora de dates)
      const isTaller = a.tipus?.toLowerCase().includes('taller');
      if (isTaller && isTallerExpiredOrEnded(a.dies || '')) return false;
      return true;
    });

    // Generem pesos pseudo-aleatoris deterministes per a cada activitat basats en la llavor de sessió de l'usuari
    const randomWeights: Record<string, number> = {};
    activitats.forEach(a => {
      randomWeights[a.id || a.slug] = getDeterministicSeed(a.id || a.slug, sessionSeed);
    });

    const tallers: typeof filtered = [];
    const confirmats: typeof filtered = [];
    const noConfirmats: typeof filtered = [];

    filtered.forEach(a => {
      const isTaller = a.tipus?.toLowerCase().includes('taller');
      if (isTaller) {
        tallers.push(a);
      } else if (a.centreInteressat) {
        confirmats.push(a);
      } else {
        noConfirmats.push(a);
      }
    });

    // Tallers s'ordenen per data més immediata
    tallers.sort((a, b) => {
      const aNext = getNextTallerDate(a.dies || '');
      const bNext = getNextTallerDate(b.dies || '');
      if (!aNext && !bNext) return 0;
      if (!aNext) return 1;
      if (!bNext) return -1;
      return aNext.getTime() - bNext.getTime();
    });

    // Extraescolars de centres confirmats: ordre aleatori estabilitzat per la sessió de l'usuari
    confirmats.sort((a, b) => (randomWeights[a.id || a.slug] ?? 0.5) - (randomWeights[b.id || b.slug] ?? 0.5));

    // Extraescolars de centres no confirmats: ordre aleatori estabilitzat per la sessió de l'usuari
    noConfirmats.sort((a, b) => (randomWeights[a.id || a.slug] ?? 0.5) - (randomWeights[b.id || b.slug] ?? 0.5));

    return [...tallers, ...confirmats, ...noConfirmats];
  }, [activitats, selectedTipus, selectedCategoria, selectedSubcategoria, selectedEdat, selectedBarri, sessionSeed]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, a) => {
      // Si hi ha un filtre de categoria actiu, agrupem sota aquella categoria.
      // Sinó, fem servir totes les categories de l'activitat (o la categoria legacy).
      let cats: string[];
      if (selectedCategoria !== 'Totes') {
        cats = [selectedCategoria];
      } else {
        cats = a.categories && a.categories.length > 0
          ? a.categories
          : [a.categoria || 'Altres'];
      }
      cats.forEach(cat => {
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(a);
      });
      return acc;
    }, {} as Record<string, Activitat[]>);
  }, [filtered, selectedCategoria]);

  const activeSponsor = useMemo(() => {
    if (!sponsors || sponsors.length === 0) return null;
    let matchingSponsors: Sponsor[];
    if (selectedCategoria === 'Totes') {
      matchingSponsors = sponsors.filter(s => (s.categoriaSlug === 'totes' || s.categoriaSlug === 'general') && s.actiu);
    } else {
      const catSlug = normalizeSlug(selectedCategoria);
      matchingSponsors = sponsors.filter(s => s.categoriaSlug === catSlug && s.actiu);
    }

    if (matchingSponsors.length === 0) return null;
    if (matchingSponsors.length === 1) return matchingSponsors[0];

    // Quan hi ha més d'1 sponsor actiu (ex: 2 -> 50%, 3 -> 33.3%, 4 -> 25%), en triem 1 a l'atzar de forma justa
    const key = `sponsor-${selectedCategoria}`;
    const seedNum = getDeterministicSeed(key, sessionSeed);
    const index = Math.floor(seedNum * matchingSponsors.length) % matchingSponsors.length;
    return matchingSponsors[index];
  }, [sponsors, selectedCategoria, sessionSeed]);

  return (
    <>
    <section className="map-section grid-12" style={{ paddingBottom: '80px' }}>
        {/* 0. Top Full-Width Page Segment Navigation (Select first, then filter!) */}
        <div style={{ gridColumn: 'span 12', paddingBottom: '16px' }}>


          {/* 2. Pestanyes Segmentades (Extraescolars vs Tallers vs Casals) */}
          <div id="filtres-header" className="filter-tabs-container">
            <button 
              type="button"
              onClick={() => updateFilter('tipus', 'Extraescolars')}
              className={`filter-tab-button ${selectedTipus !== 'Tallers i Oci' && selectedTipus !== 'Casals' ? 'active' : ''}`}
            >
              Extraescolars setmanals
            </button>
            <button 
              type="button"
              onClick={() => updateFilter('tipus', 'Tallers i Oci')}
              className={`filter-tab-button ${selectedTipus === 'Tallers i Oci' ? 'active' : ''}`}
            >
              Activitats i Tallers
            </button>
            {casalsBanner && (
              <button 
                type="button"
                onClick={() => updateFilter('tipus', 'Casals')}
                className={`filter-tab-button ${selectedTipus === 'Casals' ? 'active' : ''}`}
              >
                {casalsBanner.nom || casalsBanner.titol || (
                  <>Casals <span className="mobile-br-only"><br /></span>d&apos;estiu</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. Filters Sidebar */}
        <div className="map-container" style={{ gridColumn: 'span 4', paddingRight: '2vw' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
              Filtra les activitats
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label htmlFor="filtre-categoria" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER CATEGORIA</label>
                    <select
                        id="filtre-categoria"
                        value={selectedCategoria}
                        onChange={e => updateFilter('categoria', e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {hasSubcategories && (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <label htmlFor="filtre-subcategoria" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER SUBCATEGORIA</label>
                      <select
                          id="filtre-subcategoria"
                          value={selectedSubcategoria}
                          onChange={e => updateFilter('subcategoria', e.target.value)}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                      >
                          {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                )}

                <div>
                    <label htmlFor="filtre-edat" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER EDATS</label>
                    <select
                        id="filtre-edat"
                        value={selectedEdat}
                        onChange={e => updateFilter('edat', e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        {EDAT_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="filtre-barri" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER BARRI</label>
                    <select
                        id="filtre-barri"
                        value={selectedBarri}
                        onChange={e => updateFilter('barri', e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="Totes">Totes les poblacions</option>
                        <option value="Girona" style={{ fontWeight: 700 }}>Girona (tots els barris)</option>
                        {barris.girona.map(b => {
                          const displayName = b.startsWith('Girona - ') ? b.replace('Girona - ', '') : b;
                          return <option key={b} value={b}>{'   ' + displayName}</option>;
                        })}
                        {barris.altres.length > 0 && (
                          <>
                            <option disabled style={{ color: '#999' }}>──────────────</option>
                            <option disabled style={{ fontWeight: 700, color: 'var(--fosc)' }}>Altres poblacions</option>
                            {barris.altres.map(b => <option key={b} value={b}>{'   ' + b}</option>)}
                          </>
                        )}
                    </select>
                </div>
                
                {/* Botó "Veure X resultats" fixe directament a sobre del de netejar filtres */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('results-container');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 76;
                      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                    }
                  }}
                  className="hoverable btn-veure-resultats"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--verd, #1b3d2f)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '100px',
                    padding: '14px 24px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(27, 61, 47, 0.25)',
                    marginTop: '8px'
                  }}
                >
                  Veure {filtered.length} resultat{filtered.length !== 1 ? 's' : ''} →
                </button>

                <button 
                  onClick={() => {
                    router.replace('?', { scroll: false });
                  }}
                  className="hoverable btn-neteja-filtres"
                >
                  NETEJA ELS FILTRES
                </button>
            </div>
        </div>
        
        {/* 4. Results Column */}
        <div className="map-results" style={{ gridColumn: 'span 8', paddingLeft: '0' }}>
            <h2 aria-live="polite" style={{ fontSize: '24px', marginTop: '0', marginBottom: '24px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--verd-fosc)' }}>
              {selectedTipus === 'Casals' 
                ? `${casalsBanner?.nom || casalsBanner?.titol || "Casals d'estiu"} (${filtered.length})` 
                : selectedTipus === 'Tallers' || selectedTipus === 'Tallers i Oci'
                  ? `Activitats i Tallers (${filtered.length})`
                  : `Extraescolars Setmanals (${filtered.length})`}
            </h2>
            <div id="results-container">
                {filtered.length === 0 ? (
                    <div className="results-empty">No s&apos;han trobat activitats amb aquests filtres.</div>
                ) : (
                    <div className="results-split-grid has-sponsor">
                      <style>{`
                        .results-split-grid {
                          display: flex;
                          flex-direction: column;
                          gap: 24px;
                        }
                        .activities-column {
                          order: 2;
                        }
                        .sponsor-column {
                          order: 1;
                        }
                        .sponsor-card-premium {
                          display: flex;
                          flex-direction: column;
                          justify-content: flex-end;
                          min-height: 380px;
                          border-radius: 20px;
                          position: relative;
                          overflow: hidden;
                          text-decoration: none;
                          color: white;
                          border: 1px solid rgba(9, 26, 15, 0.35);
                          background-size: cover;
                          background-position: center;
                          background-repeat: no-repeat;
                          background-clip: padding-box;
                          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease;
                          transform: translate3d(0, 0, 0);
                          -webkit-mask-image: -webkit-radial-gradient(white, black);
                        }
                        
                        .sponsor-card-premium:hover {
                          transform: translate3d(0, -8px, 0);
                          box-shadow: 0 25px 50px rgba(12, 34, 20, 0.4);
                        }
                        
                        /* The fading dark green overlay */
                        .sponsor-card-overlay {
                          position: absolute;
                          top: -1px;
                          left: -1px;
                          right: -1px;
                          bottom: -1px;
                          background: linear-gradient(to bottom, rgba(12, 34, 20, 0.1) 0%, rgba(12, 34, 20, 0.4) 40%, rgba(9, 26, 15, 0.95) 100%);
                          z-index: 1;
                          transition: opacity 0.3s ease;
                          border-radius: inherit;
                        }
                        
                        .sponsor-card-premium:hover .sponsor-card-overlay {
                          background: linear-gradient(to bottom, rgba(12, 34, 20, 0.05) 0%, rgba(12, 34, 20, 0.3) 30%, rgba(7, 21, 12, 0.98) 100%);
                        }
                        
                        /* Top Left Orange Badge */
                        .sponsor-top-badge {
                          position: absolute;
                          top: 16px;
                          left: 16px;
                          background-color: var(--taronja);
                          color: var(--verd-fosc);
                          font-family: var(--font-sans);
                          font-size: 10px;
                          font-weight: 800;
                          text-transform: uppercase;
                          letter-spacing: 0.08em;
                          padding: 6px 12px;
                          border-radius: 30px;
                          z-index: 2;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        }
                        
                        /* Content container */
                        .sponsor-premium-content {
                          position: relative;
                          z-index: 2;
                          padding: 24px;
                          display: flex;
                          flex-direction: column;
                          gap: 12px;
                          text-align: left;
                        }
                        
                        .sponsor-pre-title {
                          font-family: var(--font-sans);
                          font-size: 10px;
                          font-weight: 800;
                          color: var(--taronja);
                          text-transform: uppercase;
                          letter-spacing: 0.1em;
                          margin-bottom: -4px;
                        }
                        
                        .sponsor-premium-title {
                          font-family: var(--font-serif);
                          font-style: italic;
                          font-size: 24px;
                          font-weight: 700;
                          color: white;
                          margin: 0;
                          line-height: 1.15;
                          letter-spacing: -0.02em;
                        }
                        
                        .sponsor-premium-desc {
                          font-family: var(--font-sans);
                          font-size: 12px;
                          color: rgba(255, 255, 255, 0.85);
                          line-height: 1.5;
                          margin: 0;
                          margin-bottom: 8px;
                        }
                        
                        /* Bottom Buttons Row */
                        .sponsor-buttons-row {
                          display: flex;
                          flex-direction: row;
                          align-items: center;
                          gap: 12px;
                          flex-wrap: wrap;
                        }
                        
                        /* Logo pill */
                        .sponsor-logo-pill {
                          display: flex;
                          align-items: center;
                          gap: 10px;
                          background-color: #f7f6f0;
                          padding: 6px 14px 6px 8px;
                          border-radius: 50px;
                          max-width: 100%;
                          border: 1px solid rgba(0,0,0,0.05);
                          overflow: hidden;
                        }
                        
                        .sponsor-logo-icon {
                          width: 32px;
                          height: 32px;
                          background-color: white;
                          border-radius: 50%;
                          overflow: hidden;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          border: 1px solid rgba(0,0,0,0.08);
                          flex-shrink: 0;
                        }
                        
                        .sponsor-logo-icon img {
                          width: 90%;
                          height: 90%;
                          object-fit: contain;
                        }
                        
                        .sponsor-logo-text {
                          font-family: var(--font-sans);
                          font-size: 11px;
                          font-weight: 800;
                          color: var(--verd-fosc);
                          letter-spacing: 0.03em;
                          line-height: 1.2;
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                        }
                        
                        /* CTA Pill */
                        .sponsor-cta-pill {
                          display: inline-flex;
                          align-items: center;
                          gap: 6px;
                          background-color: var(--taronja);
                          color: var(--verd-fosc);
                          padding: 9px 18px;
                          border-radius: 30px;
                          font-family: var(--font-sans);
                          font-size: 12px;
                          font-weight: 700;
                          letter-spacing: 0.02em;
                          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                          box-shadow: 0 4px 15px rgba(245, 166, 35, 0.2);
                        }
                        
                        .sponsor-card-premium:hover .sponsor-cta-pill {
                          background-color: white;
                          color: var(--verd-fosc);
                          box-shadow: 0 4px 15px rgba(255,255,255,0.3);
                        }
                        
                        .sponsor-cta-pill .arrow {
                          font-size: 13px;
                          transition: transform 0.3s ease;
                        }
                        
                        .sponsor-card-premium:hover .sponsor-cta-pill .arrow {
                          transform: translateX(3px);
                        }
                        
                        @media (min-width: 1024px) {
                          .results-split-grid {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 32px;
                            align-items: start;
                          }
                          .results-split-grid.has-sponsor {
                            grid-template-columns: repeat(12, 1fr);
                          }
                          .results-split-grid.has-sponsor .activities-column {
                            grid-column: span 8;
                            order: unset;
                          }
                          .results-split-grid.has-sponsor .sponsor-column {
                            grid-column: span 4;
                            position: sticky;
                            top: 100px;
                            order: unset;
                            z-index: 10;
                          }
                        }
                        
                        @media (max-width: 768px) {
                          .sponsor-card-premium {
                            min-height: 320px;
                          }
                          .sponsor-premium-title {
                            font-size: 26px;
                          }
                          .sponsor-premium-content {
                            padding: 16px;
                            gap: 8px;
                          }
                          .sponsor-buttons-row {
                            gap: 8px;
                          }
                          .sponsor-logo-pill {
                            padding: 6px 12px;
                          }
                          .sponsor-cta-pill {
                            padding: 7px 14px;
                            font-size: 11px;
                          }
                        }
                      `}</style>

                      {/* Llista d'activitats (2/3 de l'espai si hi ha sponsor) */}
                      <div className="activities-column">
                        <div className="results-list">
                            {(() => {
                              const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
                              const numCats = entries.length;
                              return entries.map(([categoria, activitatsCat]) => (
                                <AccordionCategoria
                                  key={categoria}
                                  categoria={categoria}
                                  activitats={activitatsCat}
                                  forceOpen={numCats === 1}
                                  hasSponsor={true}
                                />
                              ));
                            })()}
                        </div>
                      </div>
                      
                      {/* Sponsor enganxós / Sticky (1/3 de l'espai) */}
                      <div className="sponsor-column">
                        {activeSponsor ? (
                          <a 
                            href={activeSponsor.enllac} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="sponsor-card-premium hoverable"
                            onClick={() => handleSponsorClick(activeSponsor.nom)}
                            style={{
                              backgroundImage: activeSponsor.imatgeFonsUrl 
                                ? `url(${activeSponsor.imatgeFonsUrl})` 
                                : `linear-gradient(135deg, #091a10 0%, #0c2214 50%, #112d1b 100%)`,
                              backgroundPosition: activeSponsor.posicioFons || 'center',
                            }}
                          >
                            {/* Fons fosc per llegibilitat */}
                            <div className="sponsor-card-overlay"></div>
                            
                            {/* Badge superior: PATROCINAT · CATEGORIA */}
                            <div className="sponsor-top-badge">
                              {selectedCategoria === 'Totes' ? 'PATROCINAT' : `PATROCINAT · ${selectedCategoria.toUpperCase()}`}
                            </div>
                            
                            {/* Contingut del patrocinador */}
                            <div className="sponsor-premium-content">
                               <h3 className="sponsor-premium-title">
                                 {activeSponsor.titol || `Mou-te amb ${activeSponsor.nom}`}
                               </h3>
                              {activeSponsor.descripcio ? (
                                <p className="sponsor-premium-desc">{activeSponsor.descripcio}</p>
                              ) : selectedCategoria !== 'Totes' ? (
                                <p className="sponsor-premium-desc">{`El partner d'${selectedCategoria} a GironaXics. Troba tot el que necessites per a les teves activitats.`}</p>
                              ) : null}
                              
                              {/* Fila de botons inferiors */}
                              <div className="sponsor-buttons-row">
                                <div className="sponsor-logo-pill">
                                  {activeSponsor.imatgeUrl && (
                                    <div className="sponsor-logo-icon">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={activeSponsor.imatgeUrl} alt="" />
                                    </div>
                                  )}
                                  <span className="sponsor-logo-text">{activeSponsor.nom.toUpperCase()}</span>
                                </div>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <Link 
                            href="/patrocinis" 
                            className="sponsor-card-premium hoverable"
                            style={{
                              background: 'linear-gradient(135deg, var(--verd-fosc) 0%, #092e18 100%)',
                              border: '2px dashed var(--taronja)',
                              textDecoration: 'none'
                            }}
                          >
                            <div className="sponsor-card-overlay" style={{ background: 'rgba(12, 34, 20, 0.4)' }}></div>
                            <div className="sponsor-top-badge" style={{ backgroundColor: 'var(--taronja)', color: 'var(--verd-fosc)' }}>
                              ESPAI DISPONIBLE
                            </div>
                            <div className="sponsor-premium-content">
                              <h3 className="sponsor-premium-title" style={{ color: 'white' }}>
                                {selectedCategoria === 'Totes' 
                                  ? 'Vols patrocinar GironaXics?' 
                                  : `Vols patrocinar ${selectedCategoria}?`}
                              </h3>
                              <p className="sponsor-premium-desc" style={{ color: 'rgba(255,255,255,0.9)' }}>
                                {selectedCategoria === 'Totes'
                                  ? 'Converteix-te en el Partner exclusiu de la teva categoria (Esports, Dansa, Idiomes...) i destaca davant de milers de famílies.'
                                  : `Converteix-te en el Partner exclusiu d'aquesta categoria a GironaXics. Destaca la teva marca davant de milers de famílies.`}
                              </p>
                              <div className="sponsor-buttons-row">
                                  <div className="sponsor-cta-pill" style={{ backgroundColor: 'var(--taronja)', color: 'var(--verd-fosc)' }}>
                                    <span>Fes-te Partner</span>
                                    <span className="arrow">→</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </section>

    </>
  );
}
