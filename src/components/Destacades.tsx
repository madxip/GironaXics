import Link from 'next/link';
import Image from 'next/image';
import { getActivitatsDestacades, getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';

export default async function Destacades() {
  let dest = await getActivitatsDestacades();
  
  if (dest.length < 5) {
    const all = await getActivitats();
    const rest = all.filter(a => !dest.find(d => d.slug === a.slug));
    dest = [...dest, ...rest].slice(0, 5);
  }

  const getMockImg = (color: string) => 
    `data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23${color}'/%3E%3C/svg%3E`;

  if (dest.length < 5) return null; // Still fallback just in case there are < 5 total records

  return (
    <section className="destacades">
      <div className="masonry" id="destacades-grid">
        <Link href={`/activitats/${normalizeSlug(dest[0].categoria)}/${dest[0].slug}`} className="card card-large hoverable" style={{ textDecoration: 'none' }}>
            <Image src={dest[0].imatgeUrl || getMockImg('1A6B3A')} alt={dest[0].nom || "Imatge destacada 1"} fill style={{ objectFit: 'cover' }} />
            <div className="card-large-content">
                <div className="card-large-title">{dest[0].nom}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>{dest[0].centre} · {dest[0].barri}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[1].categoria)}/${dest[1].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={dest[1].imatgeUrl || getMockImg('F5A623')} alt={dest[1].nom || "Imatge destacada 2"} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[1].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[1].edat} · {dest[1].preu != null && dest[1].preu !== '' ? `${dest[1].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[2].categoria)}/${dest[2].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={dest[2].imatgeUrl || getMockImg('D4EDD9')} alt={dest[2].nom || "Imatge destacada 3"} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[2].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[2].edat} · {dest[2].preu != null && dest[2].preu !== '' ? `${dest[2].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[3].categoria)}/${dest[3].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={dest[3].imatgeUrl || getMockImg('1A6B3A')} alt={dest[3].nom || "Imatge destacada 4"} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[3].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[3].edat} · {dest[3].preu != null && dest[3].preu !== '' ? `${dest[3].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
        <Link href={`/activitats/${normalizeSlug(dest[4].categoria)}/${dest[4].slug}`} className="card card-normal hoverable" style={{ textDecoration: 'none' }}>
            <div className="card-normal-img" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image src={dest[4].imatgeUrl || getMockImg('F5A623')} alt={dest[4].nom || "Imatge destacada 5"} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="card-normal-content">
                <div className="card-normal-title">{dest[4].nom}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dest[4].edat} · {dest[4].preu != null && dest[4].preu !== '' ? `${dest[4].preu}€` : 'A consultar'}</div>
            </div>
        </Link>
      </div>
    </section>
  );
}
