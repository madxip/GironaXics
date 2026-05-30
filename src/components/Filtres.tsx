"use client";

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activitat, Sponsor } from '@/lib/types';
import AccordionCategoria from './AccordionCategoria';
import { normalizeSlug } from '@/lib/utils';

const EDAT_GROUPS = [
  'Totes',
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

  // Només extraiem números si hi ha la paraula "any" o "anys" per evitar
  // confondre el curs "6è" amb "6 anys".
  if (s.includes('any')) {
    const numbers = s.match(/\d+/g)?.map(Number) || [];
    if (numbers.length > 0) {
      min = Math.min(...numbers);
      max = Math.max(...numbers);
    }
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
    if (max !== null && max >= 12) return true;
    return false;
  }

  return false;
}

export default function Filtres({ activitats, sponsors = [] }: { activitats: Activitat[], sponsors?: Sponsor[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTipus = searchParams.get('tipus') || 'Totes';
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
  };

  const handleSponsorClick = (sponsorNom: string) => {
    interface CustomWindow extends Window {
      gtag?: (
        command: 'event',
        eventName: string,
        eventParams: {
          event_category: string;
          event_label: string;
          category_name: string;
        }
      ) => void;
    }
    
    if (typeof window !== 'undefined') {
      const customWindow = window as unknown as CustomWindow;
      if (customWindow.gtag) {
        customWindow.gtag('event', 'sponsor_click', {
          event_category: 'Sponsor',
          event_label: sponsorNom,
          category_name: selectedCategoria
        });
        console.log(`[Google Analytics] Event enviat: sponsor_click (${sponsorNom})`);
      } else {
        console.log(`[Analytics Fallback] Clic registrat localment per a ${sponsorNom} (Sense Google Analytics)`);
      }
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.categoria) set.add(a.categoria); });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats]);

  const subcategories = useMemo(() => {
    if (selectedCategoria === 'Totes') return ['Totes'];
    const set = new Set<string>();
    activitats.forEach(a => {
      if (a.categoria === selectedCategoria && a.subcategoria) {
        set.add(a.subcategoria);
      }
    });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats, selectedCategoria]);

  const hasSubcategories = subcategories.length > 1;

  const barris = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.barri) set.add(a.barri); });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats]);

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
      const matchCat = selectedCategoria === 'Totes' || a.categoria === selectedCategoria;
      const matchSubcat = selectedCategoria === 'Totes' || selectedSubcategoria === 'Totes' || a.subcategoria === selectedSubcategoria;
      const matchEdat = matchEdatGroup(a.edat, selectedEdat);
      const matchBarri = selectedBarri === 'Totes' || a.barri === selectedBarri;
      return matchTipus && matchCat && matchSubcat && matchEdat && matchBarri;
    });
    // Centres confirmats primer, la resta per ordre natural
    return result.sort((a, b) => {
      const aInt = a.centreInteressat ? 1 : 0;
      const bInt = b.centreInteressat ? 1 : 0;
      return bInt - aInt;
    });
  }, [activitats, selectedTipus, selectedCategoria, selectedSubcategoria, selectedEdat, selectedBarri]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, a) => {
      const cat = a.categoria || 'Altres';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {} as Record<string, Activitat[]>);
  }, [filtered]);

  const activeSponsor = useMemo(() => {
    if (!sponsors || sponsors.length === 0 || selectedCategoria === 'Totes') return null;
    const catSlug = normalizeSlug(selectedCategoria);
    return sponsors.find(s => s.categoriaSlug === catSlug && s.actiu) || null;
  }, [sponsors, selectedCategoria]);

  return (
    <section className="map-section grid-12" style={{ paddingBottom: '80px' }}>
        <div className="map-container" style={{ gridColumn: 'span 4', paddingRight: '2vw' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
              Filtra les activitats
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label htmlFor="filtre-tipus" style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>TIPUS D&apos;OFERTA</label>
                    <select
                        id="filtre-tipus"
                        value={selectedTipus}
                        onChange={e => updateFilter('tipus', e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="Totes">Totes</option>
                        <option value="Extraescolars">Extraescolars setmanals</option>
                        <option value="Casals">Casals estacionals</option>
                        <option value="Tallers i Oci">Tallers i oci puntual</option>
                    </select>
                </div>

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
                        {barris.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                
                <button 
                  onClick={() => {
                    router.replace('?', { scroll: false });
                  }}
                  className="hoverable"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '0', border: 'none', backgroundColor: 'var(--crema-fosca)', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s', marginTop: '8px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--crema-fosca)'}
                >
                  NETEJA ELS FILTRES
                </button>
            </div>
        </div>
        
        <div className="map-results" style={{ gridColumn: 'span 8', paddingLeft: '0' }}>
            <h2>Resultats ({filtered.length})</h2>
            <div id="results-container">
                {filtered.length === 0 ? (
                    <div className="results-empty">No s&apos;han trobat activitats amb aquests filtres.</div>
                ) : (
                    <div className={`results-split-grid ${activeSponsor ? 'has-sponsor' : ''}`}>
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
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          background-size: cover;
                          background-position: center;
                          background-repeat: no-repeat;
                          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease;
                        }
                        
                        .sponsor-card-premium:hover {
                          transform: translateY(-8px);
                          box-shadow: 0 25px 50px rgba(12, 34, 20, 0.4);
                        }
                        
                        /* The fading dark green overlay */
                        .sponsor-card-overlay {
                          position: absolute;
                          top: 0;
                          left: 0;
                          right: 0;
                          bottom: 0;
                          background: linear-gradient(to bottom, rgba(12, 34, 20, 0.1) 0%, rgba(12, 34, 20, 0.4) 40%, rgba(9, 26, 15, 0.95) 100%);
                          z-index: 1;
                          transition: opacity 0.3s ease;
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
                          font-size: 32px;
                          font-weight: 700;
                          color: white;
                          margin: 0;
                          line-height: 1.15;
                          letter-spacing: -0.02em;
                        }
                        
                        .sponsor-premium-desc {
                          font-family: var(--font-sans);
                          font-size: 13px;
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
                          gap: 8px;
                          background-color: #f7f6f0;
                          padding: 8px 16px;
                          border-radius: 30px;
                          flex-shrink: 0;
                          border: 1px solid rgba(0,0,0,0.05);
                        }
                        
                        .sponsor-logo-icon {
                          width: 20px;
                          height: 20px;
                          background-color: white;
                          border-radius: 4px;
                          overflow: hidden;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          border: 1px solid rgba(0,0,0,0.05);
                          flex-shrink: 0;
                        }
                        
                        .sponsor-logo-icon img {
                          width: 85%;
                          height: 85%;
                          object-fit: contain;
                        }
                        
                        .sponsor-logo-text {
                          font-family: var(--font-sans);
                          font-size: 11px;
                          font-weight: 800;
                          color: var(--verd-fosc);
                          letter-spacing: 0.05em;
                          line-height: 1.2;
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
                              return entries.map(([categoria, activitatsCat], idx) => (
                                <AccordionCategoria
                                  key={categoria}
                                  categoria={categoria}
                                  activitats={activitatsCat}
                                  defaultOpen={numCats <= 3 || idx === 0}
                                />
                              ));
                            })()}
                        </div>
                      </div>
                      
                      {/* Sponsor enganxós / Sticky (1/3 de l'espai) */}
                      {activeSponsor && (
                        <div className="sponsor-column">
                          <a 
                            href={activeSponsor.enllac} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="sponsor-card-premium hoverable"
                            onClick={() => handleSponsorClick(activeSponsor.nom)}
                            style={{
                              backgroundImage: activeSponsor.imatgeFonsUrl 
                                ? `url(${activeSponsor.imatgeFonsUrl})` 
                                : `linear-gradient(135deg, #091a10 0%, #0c2214 50%, #112d1b 100%)`
                            }}
                          >
                            {/* Fons fosc per llegibilitat */}
                            <div className="sponsor-card-overlay"></div>
                            
                            {/* Badge superior: PATROCINAT · CATEGORIA */}
                            <div className="sponsor-top-badge">
                              PATROCINAT · {selectedCategoria.toUpperCase()}
                            </div>
                            
                            {/* Contingut del patrocinador */}
                            <div className="sponsor-premium-content">
                              <span className="sponsor-pre-title">PATROCINAT PER</span>
                              <h3 className="sponsor-premium-title">
                                {activeSponsor.titol || `Mou-te amb ${activeSponsor.nom}`}
                              </h3>
                              <p className="sponsor-premium-desc">
                                {activeSponsor.descripcio || `El partner d'${selectedCategoria} a GironaXics. Troba tot el que necessites per a les teves activitats.`}
                              </p>
                              
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
                                
                                <div className="sponsor-cta-pill">
                                  Saber-ne més <span className="arrow">→</span>
                                </div>
                              </div>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                )}
            </div>
        </div>
    </section>
  );
}
