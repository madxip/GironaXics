import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug, formatPreu } from '@/lib/utils';

export default function ActivitatCard({ activitat }: { activitat: Activitat }) {
  const catSlug = normalizeSlug(activitat.categoria);
  const href = `/activitats/${catSlug}/${activitat.slug}`;
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
          </div>
        </div>
      </div>
    </Link>
  );
}
