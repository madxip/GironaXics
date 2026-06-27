'use client';
import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug, formatPreu } from '@/lib/utils';
import { parseVacances, isInVacances, getNextValidTallerDate, MONTH_ABBR_CAT } from '@/lib/tallerDates';

const saveScroll = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('gironaxics-scroll', String(window.scrollY));
  }
};

interface ParsedDate {
  day: string;
  month: string;
}

const WEEKDAYS = [
  { names: ["dilluns"], abbr: "Dl" },
  { names: ["dimarts"], abbr: "Dm" },
  { names: ["dimecres"], abbr: "Dc" },
  { names: ["dijous"], abbr: "Dj" },
  { names: ["divendres"], abbr: "Dv" },
  { names: ["dissabte"], abbr: "Ds" },
  { names: ["diumenge"], abbr: "Du" },
];

const parseTallerDates = (text: string): ParsedDate[] => {
  if (!text) return [];
  const normalized = text.toLowerCase();
  
  const months = [
    { name: "gener", abbr: "GEN" },
    { name: "febrer", abbr: "FEB" },
    { name: "març", abbr: "MAR" },
    { name: "abril", abbr: "ABR" },
    { name: "maig", abbr: "MAIG" },
    { name: "juny", abbr: "JUNY" },
    { name: "juliol", abbr: "JUL" },
    { name: "agost", abbr: "AGO" },
    { name: "setembre", abbr: "SET" },
    { name: "octubre", abbr: "OCT" },
    { name: "novembre", abbr: "NOV" },
    { name: "desembre", abbr: "DES" }
  ];

  const foundMonths: { index: number; abbr: string; name: string }[] = [];
  months.forEach(m => {
    let idx = normalized.indexOf(m.name);
    while (idx !== -1) {
      foundMonths.push({ index: idx, abbr: m.abbr, name: m.name });
      idx = normalized.indexOf(m.name, idx + 1);
    }
  });
  foundMonths.sort((a, b) => a.index - b.index);

  const numberRegex = /\b\d{1,2}\b/g;
  const foundNumbers: { index: number; val: string }[] = [];
  let match;
  while ((match = numberRegex.exec(normalized)) !== null) {
    foundNumbers.push({ index: match.index, val: match[0] });
  }

  if (foundNumbers.length === 0 && foundMonths.length > 0) {
    return [{ day: "--", month: foundMonths[0].abbr }];
  }

  if (foundNumbers.length > 0 && foundMonths.length === 0) {
    return []; // Cap mes reconegut → mostra OCI per defecte
  }

  if (foundNumbers.length === 0 && foundMonths.length === 0) {
    // Comprova si hi ha un dia de la setmana → mostra l'abreviatura
    for (const wd of WEEKDAYS) {
      if (wd.names.some(n => normalized.includes(n))) {
        return [{ day: wd.abbr, month: "setm." }];
      }
    }
    return [];
  }

  const result: ParsedDate[] = [];
  foundNumbers.forEach(n => {
    let assocMonth = foundMonths.find(m => m.index > n.index);
    if (!assocMonth && foundMonths.length > 0) {
      assocMonth = foundMonths[foundMonths.length - 1];
    }
    if (assocMonth) {
      result.push({ day: n.val, month: assocMonth.abbr });
    }
  });

  return result;
};

const formatTallerPrice = (preuRaw: string | number | undefined): string => {
  if (preuRaw === undefined || preuRaw === null) return 'N/A';
  const str = String(preuRaw).trim();
  if (!str) return 'N/A';
  if (str.toLowerCase() === 'gratuït' || str.toLowerCase() === 'gratuit') return 'Gratuït';
  
  if (/^[0-9\s.,]+$/.test(str)) {
    return `${str}€`;
  }
  if (str.includes('€')) {
    return str;
  }
  return `${str}€`;
};

export default function ActivitatCard({ activitat }: { activitat: Activitat }) {
  const catSlug = normalizeSlug(activitat.categoria);
  const href = `/activitats/${catSlug}/${activitat.slug}`;
  const isCasal = activitat.tipus?.toLowerCase().includes('casal');
  const isTaller = activitat.tipus?.toLowerCase().includes('taller') || activitat.tipus?.toLowerCase().includes('oci');

  if (isCasal) {
    const logoUrl = activitat.centreImatgeUrl;
    const diesLabel = (activitat.dies || "").toLowerCase().includes('torn') ? 'Torns' : 'Dies';
    
    // Parse price to extract large bold number and small unit/period
    const parseCasalPrice = (preuRaw: string | number | undefined) => {
      if (preuRaw === undefined || preuRaw === null) return { num: 'N/A', unit: '' };
      const str = String(preuRaw).trim();
      if (!str) return { num: 'N/A', unit: '' };
      
      if (str.toLowerCase() === 'gratuït' || str.toLowerCase() === 'gratuit') {
        return { num: '0', unit: '€ (Gratuït)' };
      }
      
      if (/^[0-9\s.,]+$/.test(str)) {
        return { num: str, unit: '€ /mes' };
      }
      
      if (str.includes('€')) {
        const parts = str.split('€');
        const num = parts[0].trim();
        let unit = parts.slice(1).join('€').trim();
        if (unit.startsWith('/')) {
          unit = `€ ${unit}`;
        } else if (unit) {
          unit = `€ / ${unit}`;
        } else {
          unit = '€ /mes';
        }
        return { num, unit };
      }
      
      return { num: str, unit: '' };
    };

    const priceInfo = parseCasalPrice(activitat.preu);

    return (
      <Link href={href} className="casal-card-wrapper" onClick={saveScroll}>
        {/* Top Row: Logo & Badge */}
        <div className="casal-card-top-row">
          {logoUrl ? (
            <div className="casal-card-logo-container">
              <Image 
                src={logoUrl} 
                alt={activitat.centre} 
                fill 
                style={{ objectFit: 'contain' }} 
                sizes="64px" 
              />
            </div>
          ) : (
            <div className="casal-card-logo-container" style={{ backgroundColor: 'var(--crema-fosca)' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--verd-fosc)' }}>
                {activitat.centre.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <span className="casal-card-badge">
            Places Limitades
          </span>
        </div>

        {/* Info Block */}
        <div className="casal-card-info-block">
          <h4 className="casal-card-title">{activitat.nom}</h4>
          <div className="casal-card-subtitle">
            {activitat.centre} · {activitat.barri}
          </div>

          {/* Specs Table */}
          <div className="casal-card-specs-container">
            <div className="casal-card-spec-row">
              <span className="casal-card-spec-label">Edats</span>
              <span className="casal-card-spec-value">{activitat.edat}</span>
            </div>
            <div className="casal-card-spec-row">
              <span className="casal-card-spec-label">Horari</span>
              <span className="casal-card-spec-value">{activitat.horari}</span>
            </div>
            {activitat.dies && (
              <div className="casal-card-spec-row">
                <span className="casal-card-spec-label">{diesLabel}</span>
                <span className="casal-card-spec-value">{activitat.dies}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="casal-card-bottom-bar">
          <div className="casal-card-price-container">
            <span className="casal-card-price-num">{priceInfo.num}</span>
            {priceInfo.unit && <span className="casal-card-price-unit">{priceInfo.unit}</span>}
          </div>
          <span className="casal-card-action-text">
            Reserva plaça →
          </span>
        </div>
      </Link>
    );
  }

  if (isTaller) {
    const parsedDates = parseTallerDates(activitat.dies || '');
    const formattedPrice = formatTallerPrice(activitat.preu);

    // ── Vacances logic ──────────────────────────────────────────
    const vacRanges = parseVacances(activitat.centreVacances || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inVacation = vacRanges.length > 0 && isInVacances(today, vacRanges);

    // Badge a mostrar durant vacances
    let vacBadge: { day: string; month: string } | null = null;
    if (inVacation) {
      const nextDate = getNextValidTallerDate(activitat.dies || '', vacRanges);
      if (nextDate) {
        vacBadge = {
          day: String(nextDate.getDate()),
          month: MONTH_ABBR_CAT[nextDate.getMonth()] || '',
        };
      }
    }
    // ────────────────────────────────────────────────────────────

    return (
      <Link href={href} className="taller-card-wrapper" onClick={saveScroll}>
        {/* Top Row: Calendars and Tag */}
        <div className="taller-card-top-row">
          <div className="taller-card-calendars-container">
            {inVacation ? (
              // Durant vacances: mostra la data de represa
              <div className="taller-card-calendar taller-card-calendar--vacances" title="Reprèn activitat">
                {vacBadge ? (
                  <>
                    <span className="taller-card-calendar-day">{vacBadge.day}</span>
                    <span className="taller-card-calendar-month">{vacBadge.month}</span>
                  </>
                ) : (
                  <>
                    <span className="taller-card-calendar-day" style={{ fontSize: '9px', lineHeight: 1.1 }}>Rep.</span>
                    <span className="taller-card-calendar-month">SET</span>
                  </>
                )}
              </div>
            ) : parsedDates.length > 0 ? (
              parsedDates.slice(0, 3).map((d, index) => (
                <div key={index} className="taller-card-calendar">
                  <span className="taller-card-calendar-day">{d.day}</span>
                  <span className="taller-card-calendar-month">{d.month}</span>
                </div>
              ))
            ) : (
              <div className="taller-card-calendar">
                <span className="taller-card-calendar-day">--</span>
                <span className="taller-card-calendar-month">OCI</span>
              </div>
            )}
            {!inVacation && parsedDates.length > 3 && (
              <span className="taller-card-more-dates-badge">
                +{parsedDates.length - 3}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {inVacation && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#e67e22', background: '#fef3e2', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                VACANCES
              </span>
            )}
            {activitat.subcategoria && (
              <span className="taller-card-tag">
                {activitat.subcategoria}
              </span>
            )}
          </div>
        </div>

        {/* Info Block */}
        <div className="taller-card-info-block">
          <h4 className="taller-card-title">{activitat.nom}</h4>
          <div className="taller-card-subtitle">
            {activitat.centre} &middot; {activitat.edat}
          </div>
        </div>

        {/* Divider and Bottom row */}
        <div className="taller-card-bottom-row">
          <span className="taller-card-time">{activitat.horari}</span>
          <span className="taller-card-price">{formattedPrice}</span>
        </div>
      </Link>
    );
  }

  const imageUrl = activitat.centreImatgeUrl || activitat.imatgeUrl;
  const isLogo = !!activitat.centreImatgeUrl;
  const isInteressat = !!activitat.centreInteressat;

  return (
    <Link
      href={href}
      className={`activitat-card hoverable ${isInteressat ? 'premium-card' : 'normal-card'}`}
      onClick={saveScroll}
    >
      {/* Badge premium per a centres confirmats */}
      {isInteressat && (
        <span className="activitat-badge">
          ★ Centre confirmat
        </span>
      )}

      {/* Contingut interior */}
      <div className="activitat-card-content">
        {imageUrl ? (
          <div className={`activitat-image-container ${isLogo ? 'logo-img' : 'normal-img'}`}>
            <Image 
              src={imageUrl} 
              alt={activitat.nom} 
              fill 
              style={{ objectFit: isLogo ? 'contain' : 'cover', padding: isLogo ? '6px' : '0' }} 
              sizes="80px" 
            />
          </div>
        ) : (
          <div className="activitat-image-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--crema-fosca)', borderRadius: '8px', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--verd)" strokeWidth="1.5" style={{ opacity: 0.4, width: '28px', height: '28px' }} aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        
        <div className="activitat-info">
          <div className="activitat-title-row">
            <div className="result-title">{activitat.nom}</div>
          </div>
          <div className="result-meta">
              <span>{activitat.centre}</span>
              <span>·</span>
              <span>{activitat.subcategoria || activitat.categoria}</span>
              <span>·</span>
              <span>{activitat.edat}</span>
              <span>·</span>
              <span className="activitat-price">
                {formatPreu(activitat.preu)}
              </span>
              {activitat.tipus && !activitat.tipus.toLowerCase().includes('extraescolar') && (
                <>
                  <span>·</span>
                  <span className={`activitat-type-badge ${activitat.tipus.toLowerCase().includes('casal') ? 'casal' : 'taller'}`}>
                    {activitat.tipus.toLowerCase().includes('casal') ? 'Casal' : 'Taller o Oci'}
                  </span>
                </>
              )}
          </div>
        </div>
      </div>
    </Link>
  );
}
