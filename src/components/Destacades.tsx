'use client';

import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/utils';
import { useMemo } from 'react';

const saveScroll = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('gironaxics-scroll', String(window.scrollY));
  }
};

interface Props {
  destacades?: Activitat[];
  all: Activitat[];
}

export default function Destacades({ all }: Props) {
  // Seleccionem les 5 últimes activitats entrades a Airtable de 5 centres diferents
  const cards = useMemo(() => {
    const seenCentres = new Set<string>();
    const result: Activitat[] = [];
    const reversed = [...all].reverse();

    for (const act of reversed) {
      const c = (act.centre || '').trim().toLowerCase();
      if (!c || seenCentres.has(c)) continue;
      seenCentres.add(c);
      result.push(act);
      if (result.length >= 5) break;
    }

    // Si no arribem a 5 centres diferents, completem amb les últimes entrades restants
    if (result.length < 5) {
      for (const act of reversed) {
        if (!result.some(r => r.slug === act.slug)) {
          result.push(act);
          if (result.length >= 5) break;
        }
      }
    }

    return result;
  }, [all]);

  const getMockImg = (color: string) =>
    `data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23${color}'/%3E%3C/svg%3E`;

  const mockColors = ['1B3D2F', '0C2214', '1A6B3A', '062612', '1B3D2F'];

  if (cards.length === 0) return null;

  return (
    <section className="destacades" style={{ paddingBottom: '60px' }}>
      <div className="ultimes-novetats-grid">
        {cards.map((act, i) => {
          const categoryTag = (act.subcategoria || act.categoria || 'ACTIVITAT').toUpperCase();
          const locationText = act.barri || 'Girona';
          const imgSrc = act.imatgeThumbnailUrl || act.imatgeUrl || act.centreImatgeUrl || getMockImg(mockColors[i % mockColors.length]);
          const catSlug = normalizeSlug(act.categoria) || 'general';

          return (
            <Link
              key={`${act.slug}-${i}`}
              href={`/activitats/${catSlug}/${act.slug}`}
              onClick={saveScroll}
              className="novetat-card hoverable"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                backgroundColor: '#ffffff',
                border: '1.5px solid rgba(27, 61, 47, 0.12)',
                boxShadow: '0 4px 20px rgba(12, 34, 20, 0.05)',
                overflow: 'hidden',
                textDecoration: 'none',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {/* Part superior: Imatge Neta + Badge Categoria Verd Fosc GironaXics */}
              <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
                <Image
                  src={imgSrc}
                  alt={act.nom || 'Imatge activitat'}
                  fill
                  style={{ objectFit: 'cover' }}
                />

                {/* Badge de Categoria Verd Fosc GironaXics */}
                <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 2 }}>
                  <span style={{
                    backgroundColor: 'var(--verd-fosc, #0c2214)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '30px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}>
                    {categoryTag}
                  </span>
                </div>
              </div>

              {/* Part inferior: Informació de l'activitat en Verd Fosc GironaXics, SENSE PREU */}
              <div style={{
                padding: '20px 20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#ffffff',
                flex: 1,
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Nom del Centre en Verd Fosc GironaXics */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--verd-fosc, #0c2214)',
                    marginBottom: '4px'
                  }}>
                    {act.centre}
                  </div>

                  {/* Títol Activitat en Serifa Itàlica Verd Fosc GironaXics */}
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--verd-fosc, #0c2214)',
                    margin: 0,
                    lineHeight: 1.25
                  }}>
                    {act.nom}
                  </h3>
                </div>

                {/* Separador subtil */}
                <div style={{ height: '1px', backgroundColor: 'rgba(12, 34, 20, 0.08)', margin: '2px 0' }} />

                {/* Línia 1: Edat i Ubicació en Verd Fosc GironaXics */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--verd-fosc, #0c2214)', fontWeight: 600 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--verd-fosc, #0c2214)" strokeWidth="2" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{act.edat || 'Totes les edats'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--verd-fosc, #0c2214)', fontWeight: 600 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--verd-fosc, #0c2214)" strokeWidth="2" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{locationText}</span>
                  </div>
                </div>

                {/* Acció: Veure detalls → en Verd Fosc GironaXics */}
                <div style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: 'var(--verd-fosc, #0c2214)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px'
                }}>
                  Veure detalls →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .ultimes-novetats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .ultimes-novetats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .ultimes-novetats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </section>
  );
}
