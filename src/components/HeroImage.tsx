'use client';

import { useState } from 'react';

interface HeroImageProps {
  src: string;
  alt: string;
}

/**
 * Hero amb efecte "fons difuminat" estil YouTube:
 * - Capa 0: mateixa imatge estirada i blurred de fons
 * - Capa 1: imatge principal sense retallar (contain), amb màscara lateral adaptativa
 *
 * La màscara s'ajusta dinàmicament un cop es carrega la imatge perquè
 * object-fit:contain deixa espai als laterals que varia segons l'aspect ratio de
 * la imatge. Sense ajust dinàmic, el difuminat no arriba a la vora del contingut
 * visual per a imatges retrat o quadrades.
 */
export default function HeroImage({ src, alt }: HeroImageProps) {
  // Percentatge de difuminat inicial (optimista per a paisatges)
  const [maskPct, setMaskPct] = useState(12);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerAspect = 16 / 9; // aspect ratio del .modal-hero
    const imageAspect = img.naturalWidth / img.naturalHeight;

    let pct: number;
    if (imageAspect >= containerAspect) {
      // La imatge omple l'amplada → difuminat suau als extrems
      pct = 10;
    } else {
      // La imatge NO omple l'amplada: hi ha espai buit als laterals
      // Calculem quant % d'espai buit hi ha a cada costat i afegim 8% extra
      // per solapar amb la vora real del contingut de la imatge
      const filledWidthPct = (imageAspect / containerAspect) * 100;
      const emptyEdgePct = (100 - filledWidthPct) / 2;
      pct = Math.round(emptyEdgePct) + 8;
    }

    setMaskPct(pct);
  };

  const maskValue = `linear-gradient(to right, transparent 0%, black ${maskPct}%, black ${100 - maskPct}%, transparent 100%)`;

  return (
    <>
      {/* Capa 0 — fons difuminat (cover) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(22px) saturate(1.3) brightness(0.6)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />

      {/* Capa 1 — imatge principal (contain), màscara lateral adaptativa */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 1,
          maskImage: maskValue,
          WebkitMaskImage: maskValue,
        }}
      />
    </>
  );
}
