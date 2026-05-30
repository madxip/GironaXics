import Link from 'next/link';
import Image from './SafeImage';
import { Activitat } from '@/lib/types';
import { normalizeSlug, formatPreu } from '@/lib/utils';

const TXT_SENSE_IMG = 'Sense img';

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
          <div className="activitat-image-placeholder">
            {TXT_SENSE_IMG}
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
