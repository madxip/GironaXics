"use client";

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activitat, Sponsor, CasalsBanner } from '@/lib/types';
import AccordionCategoria from './AccordionCategoria';
import { normalizeSlug } from '@/lib/utils';
import { trackEvent } from '@/lib/trackEvent';
import { BARRIS_GIRONA_SET } from '@/lib/barris';

const renderBannerTitle = (title: string) => {
  if (!title) return null;
  const regex = /\[(.*?)\]/;
  const match = title.match(regex);
  if (match) {
    const parts = title.split(regex);
    return (
      <>
        {parts[0]}
        <span style={{ color: '#d95738' }}>{match[1]}</span>
        {parts[2]}
      </>
    );
  }
  return title;
};

const renderBannerIcon = (nom: string) => {
  const s = (nom || '').toLowerCase();
  
  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '40px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '220px',
    height: '220px',
    opacity: 0.12,
    color: '#ffffff',
    pointerEvents: 'none',
    transition: 'all 0.3s ease'
  };

  if (s.includes('estiu') || s.includes('summer') || s.includes('sol')) {
    // Sun SVG for Summer
    return (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="casals-snowflake-svg"
        style={iconStyle}
      >
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="12" y1="2" x2="12" y2="4"></line>
        <line x1="12" y1="20" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="4" y2="12"></line>
        <line x1="20" y1="12" x2="22" y2="12"></line>
        <line x1="6.34" y1="17.66" x2="4.93" y2="19.07"></line>
        <line x1="19.07" y1="4.93" x2="17.66" y2="6.34"></line>
      </svg>
    );
  }

  if (s.includes('santa') || s.includes('primavera') || s.includes('pasqua') || s.includes('spring')) {
    // Leaf/Flower SVG for Spring
    return (
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="casals-snowflake-svg"
        style={iconStyle}
      >
        <path d="M12 2c1.7 0 3 1.3 3 3v14c0 1.7-1.3 3-3 3s-3-1.3-3-3V5c0-1.7 1.3-3 3-3z"></path>
        <path d="M12 6c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6z"></path>
      </svg>
    );
  }

  // Fallback: Snowflake for Nadal/Winter
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="casals-snowflake-svg"
      style={iconStyle}
    >
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <line x1="22" y1="12" x2="2" y2="12"></line>
      <path d="m20 16-4-4 4-4"></path>
      <path d="m4 8 4 4-4 4"></path>
      <path d="m16 20-4-4-4 4"></path>
      <path d="m8 4 4 4 4-4"></path>
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
      <line x1="19.07" y1="19.07" x2="4.93" y2="4.93"></line>
      <path d="m14 4 4 4v4"></path>
      <path d="m10 4-4 4v4"></path>
      <path d="m18 14v4l-4 4"></path>
      <path d="m6 14v4l4 4"></path>
    </svg>
  );
};

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

export default function Filtres({ 
  activitats, 
  sponsors = [],
  casalsBanner = null
}: { 
  activitats: Activitat[], 
  sponsors?: Sponsor[],
  casalsBanner?: CasalsBanner | null
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    // Tracking analytics
    if (value !== 'Totes') {
      if (key === 'categoria')    trackEvent('filter_categoria', value);
      else if (key === 'barri')   trackEvent('filter_barri', value);
      else if (key === 'edat')    trackEvent('filter_edat', value);
      else if (key === 'tipus')   trackEvent('filter_tipus', value);
    }
  };

  const scrollToFiltresHeader = () => {
    setTimeout(() => {
      const element = document.getElementById('filtres-header');
      if (element) {
        const isMobile = window.innerWidth <= 768;
        const nav = document.getElementById('nav');
        const navHeight = nav ? nav.offsetHeight : (isMobile ? 65 : 80);
        // We want to show the bottom part of the banner (footer + bottom padding + margin) below the nav.
        // On desktop: ~100px. On mobile: ~75px.
        const bannerVisibleBottom = isMobile ? 75 : 100;
        const offset = -(navHeight + bannerVisibleBottom);
        const y = element.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
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
    const gironaSet = new Set<string>();
    const altresSet = new Set<string>();
    activitats.forEach(a => {
      if (!a.barri) return;
      const b = a.barri.trim();
      if (BARRIS_GIRONA_SET.has(b)) gironaSet.add(b);
      else altresSet.add(b);
    });
    return {
      girona: Array.from(gironaSet).sort(),
      altres: Array.from(altresSet).sort()
    };
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
        {/* 0. Top Full-Width Page Segment Navigation (Select first, then filter!) */}
        <div style={{ gridColumn: 'span 12', paddingBottom: '16px' }}>
          <style>{`
            /* Casals Banner Styles */
            .casals-seasonal-banner {
              display: flex;
              width: 100%;
              transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .casals-seasonal-banner:hover {
              transform: translateY(-2px);
              border-color: #d95738 !important;
            }
            .casals-seasonal-banner:hover .casals-snowflake-svg {
              opacity: 0.22 !important;
              transform: translateY(-50%) rotate(15deg) !important;
            }
            .casals-banner-action-btn:hover {
              background-color: #bd3f28 !important;
              transform: scale(1.02);
            }
            
            /* Tabs Navigation Styles */
            .filter-tabs-container {
              display: flex;
              gap: 24px;
              margin-bottom: 28px;
              border-bottom: 1px solid rgba(12, 34, 20, 0.1);
              padding-bottom: 2px;
            }
            .filter-tab-button {
              font-family: var(--font-sans);
              font-size: 13px;
              font-weight: 800;
              color: rgba(12, 34, 20, 0.4);
              background: none;
              border: none;
              padding: 10px 4px;
              cursor: pointer;
              position: relative;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              outline: none;
            }
            .filter-tab-button:hover {
              color: var(--verd-fosc);
            }
            .filter-tab-button.active {
              color: var(--verd-fosc);
            }
            .filter-tab-button.active::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 3px;
              background-color: var(--verd-fosc);
            }

            /* Responsive Mobile Enhancements */
            @media (max-width: 768px) {
              .casals-seasonal-banner {
                padding: 32px 24px !important;
                border-radius: 12px !important;
              }
              .casals-banner-title {
                font-size: 28px !important;
              }
              .casals-banner-footer {
                flex-direction: column;
                align-items: flex-start !important;
                gap: 16px;
              }
              .casals-snowflake-svg {
                width: 130px !important;
                height: 130px !important;
                right: -15px !important;
                bottom: -15px !important;
                top: auto !important;
                transform: none !important;
              }
              .casals-seasonal-banner:hover .casals-snowflake-svg {
                transform: rotate(15deg) !important;
              }
              .filter-tabs-container {
                gap: 16px;
                margin-bottom: 20px;
              }
              .filter-tab-button {
                font-size: 11px;
                padding: 8px 2px;
              }
            }
          `}</style>

          {/* 1. Franja estacional dels Casals */}
          {casalsBanner && (
            <div 
              onClick={() => {
                if (selectedTipus === 'Casals') {
                  updateFilter('tipus', 'Extraescolars');
                } else {
                  trackEvent('casals_banner_click', casalsBanner.nom);
                  updateFilter('tipus', 'Casals');
                  scrollToFiltresHeader();
                }
              }}
              className={`casals-seasonal-banner ${selectedTipus === 'Casals' ? 'active' : ''}`}
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#062612',
                border: selectedTipus === 'Casals' 
                  ? '2px solid #a83925' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '40px 48px',
                marginBottom: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 12px 32px rgba(6, 38, 18, 0.25)'
              }}
            >
              {/* Dynamic background seasonal decoration */}
              {renderBannerIcon(casalsBanner.nom)}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2, position: 'relative', textAlign: 'left', width: '100%' }}>
                {/* Kicker */}
                <span style={{ 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: '#d95738', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em' 
                }}>
                  {casalsBanner.kicker || 'Temporada'}
                </span>

                {/* Title */}
                <h3 className="casals-banner-title" style={{ 
                  margin: '8px 0', 
                  fontFamily: 'var(--font-serif)', 
                  fontStyle: 'italic', 
                  fontSize: '50px', 
                  color: '#ffffff', 
                  fontWeight: 700,
                  lineHeight: 1.2
                }}>
                  {renderBannerTitle(casalsBanner.titol || '')}
                </h3>

                {/* Subtitle */}
                <p style={{ 
                  margin: '0 0 32px 0', 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: '15px', 
                  color: 'rgba(255, 255, 255, 0.85)',
                  maxWidth: '520px',
                  lineHeight: 1.5
                }}>
                  {casalsBanner.subtitol}
                </p>

                {/* Footer row */}
                <div className="casals-banner-footer" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <span style={{ 
                    fontFamily: 'var(--font-serif)', 
                    fontStyle: 'italic', 
                    fontSize: '18px', 
                    color: '#eae6df',
                    fontWeight: 500
                  }}>
                    {casalsBanner.dates}
                  </span>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent double toggle
                      if (selectedTipus === 'Casals') {
                        updateFilter('tipus', 'Extraescolars');
                      } else {
                        updateFilter('tipus', 'Casals');
                        scrollToFiltresHeader();
                      }
                    }}
                    className="casals-banner-action-btn"
                    style={{
                      backgroundColor: '#a83925',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(168, 57, 37, 0.3)'
                    }}
                  >
                    {selectedTipus === 'Casals' ? 'Tancar filtre ×' : 'Descobreix els casals →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Pestanyes Segmentades (Extraescolars vs Tallers) */}
          <div id="filtres-header" className="filter-tabs-container">
            <button 
              onClick={() => updateFilter('tipus', 'Extraescolars')}
              className={`filter-tab-button ${selectedTipus !== 'Tallers i Oci' && selectedTipus !== 'Casals' ? 'active' : ''}`}
            >
              Extraescolars setmanals
            </button>
            <button 
              onClick={() => updateFilter('tipus', 'Tallers i Oci')}
              className={`filter-tab-button ${selectedTipus === 'Tallers i Oci' ? 'active' : ''}`}
            >
              Tallers
            </button>
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
                        <option value="Totes">Totes</option>
                        <optgroup label="Barris de Girona">
                          {barris.girona.map(b => <option key={b} value={b}>{b}</option>)}
                        </optgroup>
                        {barris.altres.length > 0 && (
                          <optgroup label="Altres poblacions">
                            {barris.altres.map(b => <option key={b} value={b}>{b}</option>)}
                          </optgroup>
                        )}
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
        
        {/* 4. Results Column */}
        <div className="map-results" style={{ gridColumn: 'span 8', paddingLeft: '0' }}>
            <h2 aria-live="polite" style={{ fontSize: '24px', marginTop: '0', marginBottom: '24px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--verd-fosc)' }}>
              {selectedTipus === 'Casals' 
                ? `Casals de Temporada (${filtered.length})` 
                : selectedTipus === 'Tallers' || selectedTipus === 'Tallers i Oci'
                  ? `Tallers (${filtered.length})`
                  : `Extraescolars Setmanals (${filtered.length})`}
            </h2>
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
                          gap: 10px;
                          background-color: #f7f6f0;
                          padding: 6px 18px 6px 8px;
                          border-radius: 50px;
                          flex-shrink: 0;
                          border: 1px solid rgba(0,0,0,0.05);
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
                                  hasSponsor={!!activeSponsor}
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
