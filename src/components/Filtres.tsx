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
                        .sponsor-card {
                          display: flex;
                          flex-direction: row;
                          align-items: center;
                          gap: 20px;
                          padding: 20px;
                          background-color: #0c2214;
                          background-image: radial-gradient(circle at 90% 10%, rgba(251, 191, 36, 0.08) 0%, transparent 60%);
                          border-radius: 16px;
                          text-decoration: none;
                          color: white;
                          border: 1px solid rgba(251, 191, 36, 0.2);
                          box-shadow: 0 10px 25px -5px rgba(12, 34, 20, 0.15);
                          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
                        }
                        .sponsor-logo-container {
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          background-color: white;
                          width: 80px;
                          height: 80px;
                          border-radius: 12px;
                          padding: 10px;
                          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                          flex-shrink: 0;
                        }
                        .sponsor-text-container {
                          flex-grow: 1;
                          display: flex;
                          flex-direction: column;
                          gap: 6px;
                        }
                        .sponsor-title {
                          margin: 0;
                          font-size: 20px;
                          font-family: var(--font-serif);
                          font-style: italic;
                          font-weight: 700;
                          color: white;
                          line-height: 1.2;
                        }
                        .sponsor-desc {
                          margin: 0;
                          font-size: 13px;
                          color: rgba(255,255,255,0.75);
                          line-height: 1.4;
                        }
                        .sponsor-cta-wrapper {
                          display: none;
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
                          .sponsor-card {
                            flex-direction: column;
                            gap: 20px;
                            padding: 24px;
                            border-radius: 20px;
                            box-shadow: 0 20px 40px -15px rgba(12, 34, 20, 0.35);
                          }
                          .sponsor-logo-container {
                            width: 100%;
                            height: 140px;
                            border-radius: 16px;
                            padding: 16px;
                          }
                          .sponsor-text-container {
                            align-items: center;
                          }
                          .sponsor-title {
                            font-size: 26px;
                          }
                          .sponsor-desc {
                            text-align: center;
                            font-size: 14px;
                            line-height: 1.5;
                          }
                          .sponsor-cta-wrapper {
                            display: flex;
                            justify-content: center;
                            margin-top: 4px;
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
                            className="sponsor-card hoverable"
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignSelf: 'stretch' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  backgroundColor: '#fbbf24', 
                                  color: '#0c2214', 
                                  fontSize: '8px', 
                                  fontWeight: 800, 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.12em', 
                                  padding: '2px 6px', 
                                  borderRadius: '30px',
                                  lineHeight: 1.2
                                }}>
                                  Patrocinador
                                </span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>✦</span>
                                <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 600, letterSpacing: '0.04em' }}>
                                  {selectedCategoria}
                                </span>
                              </div>
                            </div>
                            
                            {activeSponsor.imatgeUrl && (
                              <div className="sponsor-logo-container">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={activeSponsor.imatgeUrl} alt={activeSponsor.nom} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            )}
                            
                            <div className="sponsor-text-container">
                              <h3 className="sponsor-title">
                                {activeSponsor.nom}
                              </h3>
                              <p className="sponsor-desc">
                                El millor material i servei per a les teves activitats a Girona.
                              </p>
                            </div>
                            
                            <div className="sponsor-cta-wrapper">
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: 'transparent',
                                border: '1px solid #fbbf24',
                                color: '#fbbf24',
                                padding: '8px 16px',
                                borderRadius: '30px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                transition: 'all 0.3s ease'
                              }}>
                                Visitar web <span style={{ fontSize: '12px' }}>→</span>
                              </span>
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
