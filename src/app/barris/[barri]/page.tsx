export const revalidate = 3600; // revalida cada hora

import { Metadata } from 'next';
import { getActivitatsByBarri, getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';

export async function generateStaticParams() {
  const activitats = await getActivitats();
  const barris = new Set<string>();
  activitats.forEach(a => { if (a.barri) barris.add(normalizeSlug(a.barri)); });
  return Array.from(barris).map(barri => ({ barri }));
}

export async function generateMetadata({ params }: { params: { barri: string } }): Promise<Metadata> {
  const barriDisplay = params.barri
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\bDe\b/g, 'de')
    .replace(/\bLa\b/g, 'la')
    .replace(/\bEl\b/g, 'el')
    .replace(/\bEls\b/g, 'els')
    .replace(/\bLes\b/g, 'les');

  return {
    title: `Activitats i extraescolars al barri de ${barriDisplay} a Girona | GironaXics`,
    description: `Descobreix totes les activitats extraescolars per a nens i joves al barri de ${barriDisplay} a Girona. Troba els millors centres i activitats.`
  };
}

const TXT_INICI = 'Inici';
const TXT_BARRIS = 'Barris';
const TXT_ACTIVITATS_A = 'Activitats a ';
const TXT_SENSE_ACTIVITATS = 'No hi ha activitats llistades per aquest barri encara.';

export default async function BarriPage({ params }: { params: { barri: string } }) {
  const activitats = await getActivitatsByBarri(params.barri);
  
  // Format displayName for barri
  const barriDisplay = params.barri
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\bDe\b/g, 'de')
    .replace(/\bLa\b/g, 'la')
    .replace(/\bEl\b/g, 'el')
    .replace(/\bEls\b/g, 'els')
    .replace(/\bLes\b/g, 'les');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Activitats i extraescolars al barri de ${barriDisplay}, Girona`,
    "description": `Llista de totes les activitats extraescolars per a nens i joves al barri de ${barriDisplay} a Girona.`,
    "numberOfItems": activitats.length,
    "itemListElement": activitats.map((a, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": a.nom,
        "description": a.descripcio || `Activitat de ${a.nom} al barri de ${barriDisplay}.`,
        "provider": {
          "@type": "LocalBusiness",
          "name": a.centre,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Girona",
            "addressRegion": "Girona"
          }
        }
      }
    }))
  };

  return (
    <>
      <Nav />
      <JsonLd data={jsonLd} />
      <main style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        {/* Breadcrumbs */}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>{TXT_INICI}</Link> / 
          <span style={{ marginLeft: '8px' }}>{TXT_BARRIS}</span> / 
          <span style={{ marginLeft: '8px' }}>{barriDisplay}</span>
        </div>
        
        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1, marginBottom: '40px' }}>
          {TXT_ACTIVITATS_A}{barriDisplay}
        </h1>

        {/* Results List */}
        <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {activitats.length > 0 ? (
            activitats.map(a => (
              <ActivitatCard key={a.slug} activitat={a} />
            ))
          ) : (
            <div className="results-empty" style={{ gridColumn: '1 / -1' }}>{TXT_SENSE_ACTIVITATS}</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
