import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug, formatPreu } from '@/lib/utils';

export default function ActivitatCard({ activitat }: { activitat: Activitat }) {
  const catSlug = normalizeSlug(activitat.categoria);
  const href = `/activitats/${catSlug}/${activitat.slug}`;
  const isCasal = activitat.tipus?.toLowerCase().includes('casal');

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
      <Link href={href} className="casal-card-wrapper">
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

  const imageUrl = activitat.centreImatgeUrl || activitat.imatgeUrl;
  const isLogo = !!activitat.centreImatgeUrl;
  const isInteressat = !!activitat.centreInteressat;

  return (
    <Link
      href={href}
      className={`activitat-card hoverable ${isInteressat ? 'premium-card' : 'normal-card'}`}
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
