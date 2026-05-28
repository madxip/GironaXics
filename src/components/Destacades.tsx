'use client';

import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/utils';
import { useMemo } from 'react';

// Barreja un array de forma aleatòria (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PROMO_PREU = '10';

function CardPromo() {
  return (
    <div
      className="card card-normal hoverable"
      style={{
        background: 'linear-gradient(135deg, var(--verd-fosc) 0%, #1d5c3a 100%)',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px',
        gap: '12px',
        textDecoration: 'none',
        color: 'white',
      }}
    >
      <div style={{
        fontSize: '28px',
        lineHeight: 1,
        marginBottom: '4px',
      }}>
        ✦
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: '20px',
        lineHeight: 1.2,
        color: 'white',
      }}>
        Destaca la teva activitat
      </div>
      <div style={{
        fontSize: '13px',
        opacity: 0.8,
        lineHeight: 1.5,
        maxWidth: '200px',
      }}>
        Apareix en aquest apartat i arriba a més famílies de Girona
      </div>
      <div style={{
        marginTop: '8px',
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.03em',
        color: 'white',
      }}>
        Des de {PROMO_PREU}€/mes
      </div>
      <Link
        href="/per-a-centres"
        style={{
          marginTop: '4px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.7)',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Saber-ne més →
      </Link>
    </div>
  );
}

interface Props {
  destacades: Activitat[];
  all: Activitat[];
}

export default function Destacades({ destacades, all }: Props) {
  const TOTAL_SLOTS = 5;

  // Calculem les targetes a mostrar. useMemo garanteix que l'aleatorietat
  // és estable durant la sessió (no rebarreja en cada re-render).
  const { cards, showPromo } = useMemo(() => {
    const venudes = destacades.slice(); // destacades marcades a Airtable
    const maxVenudes = TOTAL_SLOTS;

    if (venudes.length >= maxVenudes) {
      // 5 o més venudes → mostrem les 5 primeres, sense promo
      return { cards: venudes.slice(0, TOTAL_SLOTS), showPromo: false };
    }

    // Activitats que no estan en les destacades venudes
    const slugsVenduts = new Set(venudes.map(d => d.slug));
    const pool = all.filter(a => !slugsVenduts.has(a.slug));
    const aleatories = shuffle(pool);

    // Nombre de slots lliures (reservem l'últim per la promo)
    const slotsLliures = TOTAL_SLOTS - 1 - venudes.length;
    const farciment = aleatories.slice(0, slotsLliures);
    const candidats = [...venudes, ...farciment];

    // La card gran (posició 0) ha de tenir foto pròpia (imatgeUrl).
    // Si la primera no en té, busquem la primera del pool que sí tingui.
    const granIdx = candidats.findIndex(a => !!a.imatgeUrl);
    if (granIdx > 0) {
      // Posem la que té foto al capdavant, deixem la resta en ordre
      const ambFoto = candidats[granIdx];
      candidats.splice(granIdx, 1);
      candidats.unshift(ambFoto);
    }
    // Si granIdx === -1 no hi ha cap amb foto → deixem l'ordre tal qual (fallback)

    return {
      cards: candidats,
      showPromo: true,
    };
  }, [destacades, all]);

  const getMockImg = (color: string) =>
    `data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23${color}'/%3E%3C/svg%3E`;

  const mockColors = ['1A6B3A', 'F5A623', 'D4EDD9', '1A6B3A', 'F5A623'];

  // Necessitem almenys la gran + suficients per emplenar (la promo compta com a slot)
  if (cards.length === 0) return null;

  // Slot 0 → card gran, slots 1-3 → cards normals, slot 4 → promo o normal
  const gran = cards[0];
  const normals = cards.slice(1); // fins a 3 normals
  const totalNormals = showPromo ? normals : cards.slice(1, 4);

  return (
    <section className="destacades">
      <div className="masonry" id="destacades-grid">

        {/* Card gran (posició 0) */}
        <Link
          href={`/activitats/${normalizeSlug(gran.categoria)}/${gran.slug}`}
          className="card card-large hoverable"
          style={{ textDecoration: 'none' }}
        >
          <Image
            src={gran.imatgeUrl || getMockImg(mockColors[0])}
            alt={gran.nom || 'Imatge destacada'}
            fill
            style={{ objectFit: 'cover' }}
          />
          <div className="card-large-content">
            <div className="card-large-title">{gran.nom}</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>{gran.centre} · {gran.barri}</div>
          </div>
        </Link>

        {/* Cards normals (posicions 1–3) */}
        {totalNormals.map((a, i) => (
          <Link
            key={a.slug}
            href={`/activitats/${normalizeSlug(a.categoria)}/${a.slug}`}
            className="card card-normal hoverable"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '140px' }}>
              <Image
                src={a.imatgeUrl || getMockImg(mockColors[(i + 1) % mockColors.length])}
                alt={a.nom || `Imatge destacada ${i + 2}`}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="card-normal-content">
              <div className="card-normal-title">{a.nom}</div>
              <div className="card-normal-info">
                {a.centre} · {a.edat} · {a.preu != null && a.preu !== '' ? `${a.preu}€` : 'A consultar'}
              </div>
            </div>
          </Link>
        ))}

        {/* Última posició: promo o 5a activitat */}
        {showPromo ? (
          <CardPromo />
        ) : cards[4] ? (
          <Link
            href={`/activitats/${normalizeSlug(cards[4].categoria)}/${cards[4].slug}`}
            className="card card-normal hoverable"
            style={{ textDecoration: 'none' }}
          >
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '140px' }}>
              <Image
                src={cards[4].imatgeUrl || getMockImg(mockColors[4])}
                alt={cards[4].nom || 'Imatge destacada 5'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="card-normal-content">
              <div className="card-normal-title">{cards[4].nom}</div>
              <div className="card-normal-info">
                {cards[4].centre} · {cards[4].edat} · {cards[4].preu != null && cards[4].preu !== '' ? `${cards[4].preu}€` : 'A consultar'}
              </div>
            </div>
          </Link>
        ) : null}

      </div>
    </section>
  );
}
