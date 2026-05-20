import Link from 'next/link';
import Image from 'next/image';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/utils';

export default function ActivitatCard({ activitat }: { activitat: Activitat }) {
  const catSlug = normalizeSlug(activitat.categoria);
  const href = `/activitats/${catSlug}/${activitat.slug}`;
  const imageUrl = activitat.centreImatgeUrl || activitat.imatgeUrl;
  const isLogo = !!activitat.centreImatgeUrl;

  return (
    <Link href={href} className="activitat-card hoverable" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '20px', padding: '16px', backgroundColor: 'white', border: '1px solid var(--crema-fosca)', borderRadius: '12px', alignItems: 'center', transition: 'box-shadow 0.3s, border-color 0.3s' }}>
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
            Sense img
          </div>
        )}
        
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div className="result-title" style={{ margin: 0, lineHeight: 1.2, fontSize: '22px' }}>{activitat.nom}</div>
          </div>
          <div className="result-meta" style={{ margin: 0 }}>
              <span>{activitat.centre}</span>
              <span>·</span>
              <span>{activitat.edat}</span>
              <span>·</span>
              <span style={{ color: 'var(--taronja)', fontWeight: 700 }}>
                {activitat.preu != null && activitat.preu !== '' ? `${activitat.preu}€/mes` : 'A consultar'}
              </span>
          </div>
        </div>
    </Link>
  );
}
