"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activitat } from '@/lib/types';
import AccordionCategoria from './AccordionCategoria';

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

export default function Filtres({ activitats }: { activitats: Activitat[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategoria = searchParams.get('categoria') || 'Totes';
  const selectedSubcategoria = searchParams.get('subcategoria') || 'Totes';
  const selectedEdat = searchParams.get('edat') || 'Totes';
  const selectedBarri = searchParams.get('barri') || 'Totes';

  const [visibleCount, setVisibleCount] = useState(20);

  // Reset pagination count when any filter changes
  useEffect(() => {
    setVisibleCount(20);
  }, [selectedCategoria, selectedSubcategoria, selectedEdat, selectedBarri]);

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
      const matchCat = selectedCategoria === 'Totes' || a.categoria === selectedCategoria;
      const matchSubcat = selectedCategoria === 'Totes' || selectedSubcategoria === 'Totes' || a.subcategoria === selectedSubcategoria;
      const matchEdat = matchEdatGroup(a.edat, selectedEdat);
      const matchBarri = selectedBarri === 'Totes' || a.barri === selectedBarri;
      return matchCat && matchSubcat && matchEdat && matchBarri;
    });
    // Centres confirmats primer, la resta per ordre natural
    return result.sort((a, b) => {
      const aInt = a.centreInteressat ? 1 : 0;
      const bInt = b.centreInteressat ? 1 : 0;
      return bInt - aInt;
    });
  }, [activitats, selectedCategoria, selectedSubcategoria, selectedEdat, selectedBarri]);

  const paginatedFiltered = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const grouped = useMemo(() => {
    return paginatedFiltered.reduce((acc, a) => {
      const cat = a.categoria || 'Altres';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {} as Record<string, Activitat[]>);
  }, [paginatedFiltered]);

  return (
    <section className="map-section grid-12" style={{ paddingBottom: '80px' }}>
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
                        {barris.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                
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
        
        <div className="map-results" style={{ gridColumn: 'span 8', paddingLeft: '0' }}>
            <h2 aria-live="polite">Resultats ({filtered.length})</h2>
            <div id="results-container">
                {filtered.length === 0 ? (
                    <div className="results-empty">No s&apos;han trobat activitats amb aquests filtres.</div>
                ) : (
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
                        
                        {filtered.length > visibleCount && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                            <button
                              onClick={() => setVisibleCount(prev => prev + 20)}
                              className="hoverable"
                              style={{
                                padding: '12px 32px',
                                borderRadius: '0',
                                border: '2px solid var(--verd-fosc)',
                                backgroundColor: 'transparent',
                                color: 'var(--verd-fosc)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--verd-fosc)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--verd-fosc)';
                              }}
                            >
                              MOSTRA&apos;N MÉS ({filtered.length - visibleCount} restants)
                            </button>
                          </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </section>
  );
}
