import Link from 'next/link';
import { getActivitatsDestacades, normalizeSlug } from '@/lib/airtable';

export default async function Destacades() {
  const dest = await getActivitatsDestacades();

  const getMockImg = (color: string) => 
    `data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23${color}'/%3E%3C/svg%3E`;

  if (dest.length < 5) return null; // Fallback to avoid errors if not enough items

  return (
    <section className="destacades">
      <div className="masonry" id="destacades-grid">
        <Link href={`/activitats/${normalizeSlug(dest[0].categoria)}/${dest[0].slug}`} className="card card-large hoverable" style={{ textDecoration: 'none' }}>
            <img src={dest[0].imatgeUrl || getMockImg('1A6B3A')} alt={dest[0].nom} />
            <div className="card-large-content">
                <div className="card-large-title">{dest[0].nom}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>{dest[0].centre} · {dest[0].barri}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[1].categoria)}/${dest[1].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img"><img src={dest[1].imatgeUrl || getMockImg('F5A623')} alt={dest[1].nom} /></div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[1].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[1].edat} · {dest[1].preu != null && dest[1].preu !== '' ? `${dest[1].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[2].categoria)}/${dest[2].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img"><img src={dest[2].imatgeUrl || getMockImg('D4EDD9')} alt={dest[2].nom} /></div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[2].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[2].edat} · {dest[2].preu != null && dest[2].preu !== '' ? `${dest[2].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[3].categoria)}/${dest[3].slug}`} className="card card-text hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-text-num">04</div>
            <div className="card-text-title">{dest[3].nom}</div>
            <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '16px' }}>
                {dest[3].centre}<br />Més informació →
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[4].categoria)}/${dest[4].slug}`} className="card card-slant hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-slant-title">{dest[4].nom}<br /><span style={{ fontSize: '14px', fontWeight: 400, marginTop: '8px', display: 'block' }}>{dest[4].barri}</span></div>
        </Link>
      </div>
    </section>
  );
}
