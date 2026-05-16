import Link from 'next/link';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/airtable';

export default function ActivitatCard({ activitat }: { activitat: Activitat }) {
  const catSlug = normalizeSlug(activitat.categoria);
  const href = `/activitats/${catSlug}/${activitat.slug}`;

  return (
    <Link href={href} className="result-item hoverable" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="result-title">{activitat.nom}</div>
        <div className="result-meta">
            <span>{activitat.centre}</span>
            <span>·</span>
            <span>{activitat.edat}</span>
            <span>·</span>
            <span style={{ color: 'var(--verd)', fontWeight: 700 }}>
              {activitat.preu != null && activitat.preu !== '' ? `${activitat.preu}€/mes` : 'A consultar'}
            </span>
        </div>
    </Link>
  );
}
