"use client";

import { useState, useMemo } from 'react';
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
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Totes');
  const [selectedEdat, setSelectedEdat] = useState<string>('Totes');
  const [selectedBarri, setSelectedBarri] = useState<string>('Totes');

  const categories = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.categoria) set.add(a.categoria); });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats]);

  const barris = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.barri) set.add(a.barri); });
    return ['Totes', ...Array.from(set).sort()];
  }, [activitats]);

  const filtered = useMemo(() => {
    return activitats.filter(a => {
      const matchCat = selectedCategoria === 'Totes' || a.categoria === selectedCategoria;
      const matchEdat = matchEdatGroup(a.edat, selectedEdat);
      const matchBarri = selectedBarri === 'Totes' || a.barri === selectedBarri;
      return matchCat && matchEdat && matchBarri;
    });
  }, [activitats, selectedCategoria, selectedEdat, selectedBarri]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, a) => {
      const cat = a.categoria || 'Altres';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {} as Record<string, Activitat[]>);
  }, [filtered]);

  return (
    <section className="map-section grid-12" style={{ padding: '0 0 80px' }}>
        <div className="map-container" style={{ gridColumn: 'span 4', paddingRight: '2vw' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
              Filtra les activitats
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER CATEGORIA</label>
                    <select 
                        value={selectedCategoria} 
                        onChange={e => setSelectedCategoria(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER EDATS</label>
                    <select 
                        value={selectedEdat} 
                        onChange={e => setSelectedEdat(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        {EDAT_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--verd)', marginBottom: '8px' }}>PER BARRI</label>
                    <select 
                        value={selectedBarri} 
                        onChange={e => setSelectedBarri(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '0', border: '1px solid var(--verd)', backgroundColor: 'transparent', color: 'var(--fosc)', fontFamily: 'var(--font-sans)', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
                    >
                        {barris.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                
                <button 
                  onClick={() => {
                    setSelectedCategoria('Totes');
                    setSelectedEdat('Totes');
                    setSelectedBarri('Totes');
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
                    <div className="results-empty">No s'han trobat activitats amb aquests filtres.</div>
                ) : (
                    <div className="results-list">
                        {Object.entries(grouped)
                        .sort(([catA], [catB]) => catA.localeCompare(catB))
                        .map(([categoria, activitatsCat]) => (
                            <AccordionCategoria key={categoria} categoria={categoria} activitats={activitatsCat} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </section>
  );
}
