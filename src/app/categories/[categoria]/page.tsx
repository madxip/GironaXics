export const revalidate = 3600; // revalida cada hora

import { Metadata } from 'next';
import { getActivitatsByCategoria, getActivitats } from '@/lib/airtable';
import { normalizeSlug, safeJsonLd } from '@/lib/utils';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';

export async function generateStaticParams() {
  const activitats = await getActivitats();
  const categories = new Set<string>();
  activitats.forEach(a => { if (a.categoria) categories.add(normalizeSlug(a.categoria)); });
  return Array.from(categories).map(categoria => ({ categoria }));
}

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Activitats i extraescolars de ${catDisplay} a Girona | GironaXics`,
    description: `Totes les extraescolars de ${catDisplay} per a nens a Girona. Troba la millor opció.`
  };
}

const TXT_INICI = 'Inici';
const TXT_CATEGORIES = 'Categories';
const TXT_ACTIVITATS_DE = 'Activitats de ';
const TXT_SENSE_ACTIVITATS = 'No hi ha activitats llistades per aquesta categoria encara.';

export default async function CategoriaPage({ params }: { params: { categoria: string } }) {
  const activitats = await getActivitatsByCategoria(params.categoria);
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Activitats i extraescolars de ${catDisplay} a Girona`,
    "description": `Llista completa de cursos i activitats de ${catDisplay} per a nens i joves a Girona.`,
    "numberOfItems": activitats.length,
    "itemListElement": activitats.map((a, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": a.nom,
        "description": a.descripcio || `Curs de ${a.nom} a Girona.`,
        "provider": {
          "@type": "LocalBusiness",
          "name": a.centre
        }
      }
    }))
  };

  return (
    <>
      <Nav />
      <script type="application/ld+json">{safeJsonLd(jsonLd)}</script>
      <main style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>{TXT_INICI}</Link> / 
            <span style={{ marginLeft: '8px' }}>{TXT_CATEGORIES}</span> / 
            <span style={{ marginLeft: '8px' }}>{catDisplay}</span>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1, marginBottom: '40px' }}>
            {TXT_ACTIVITATS_DE}{catDisplay}
        </h1>

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
