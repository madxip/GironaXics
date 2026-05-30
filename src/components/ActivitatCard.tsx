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
      className="activitat-card hoverable"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        gap: '20px',
        padding: '16px',
        backgroundColor: isInteressat ? '#fffdf5' : 'white',
        border: isInteressat ? '1px solid #d4a82a' : '1px solid var(--crema-fosca)',
        borderRadius: '12px',
        alignItems: 'center',
        transition: 'box-shadow 0.3s, border-color 0.3s',
        position: 'relative',
      }}
    >
        {/* Badge premium per a centres confirmats */}
        {isInteressat && (
          <span style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#92620a',
            backgroundColor: '#fef3c7',
            border: '1px solid #f5d07a',
            borderRadius: '20px',
            padding: '2px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: 1.6,
            pointerEvents: 'none',
          }}>
            ★ Centre confirmat
          </span>
        )}

        {imageUrl ? (
          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: isLogo ? '1px solid var(--crema-fosca)' : 'none', backgroundColor: isLogo ? '#fcfcfc' : 'var(--crema-fosca)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image 
              src={imageUrl} 
              alt={activitat.nom} 
              fill 
              style={{ objectFit: isLogo ? 'contain' : 'cover', padding: isLogo ? '6px' : '0' }} 
              sizes="80px" 
            />
          </div>
        ) : (
          <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', backgroundColor: 'var(--crema-fosca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase' }}>
            {TXT_SENSE_IMG}
          </div>
        )}
        
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: isInteressat ? '110px' : '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div className="result-title" style={{ margin: 0, lineHeight: 1.2, fontSize: '22px' }}>{activitat.nom}</div>
          </div>
          <div className="result-meta" style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span>{activitat.centre}</span>
              <span>·</span>
              <span>{activitat.subcategoria || activitat.categoria}</span>
              <span>·</span>
              <span>{activitat.edat}</span>
              <span>·</span>
              <span style={{ color: 'var(--taronja-text)', fontWeight: 700 }}>
                {formatPreu(activitat.preu)}
              </span>
              {activitat.tipus && activitat.tipus !== 'Extraescolar' && (
                <>
                  <span>·</span>
                  <span style={{
                    backgroundColor: activitat.tipus === 'Casal' ? 'var(--taronja)' : '#10b981',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1.4,
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    {activitat.tipus === 'Casal' ? 'Casal' : 'Taller o Oci'}
                  </span>
                </>
              )}
          </div>
        </div>
    </Link>
  );
}

