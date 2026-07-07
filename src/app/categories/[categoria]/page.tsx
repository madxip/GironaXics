export const revalidate = 86400; // revalida cada 24h

import { Metadata } from 'next';
import { getActivitatsByCategoria, getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';

export async function generateStaticParams() {
  const activitats = await getActivitats();
  const categories = new Set<string>();
  activitats.forEach(a => {
    const cats = a.categories || [a.categoria];
    cats.forEach((c: string) => { if (c) categories.add(normalizeSlug(c)); });
  });
  return Array.from(categories).map(categoria => ({ categoria }));
}

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Activitats i extraescolars de ${catDisplay} a Girona | GironaXics`,
    description: `Totes les extraescolars de ${catDisplay} per a nens a Girona. Troba la millor opció.`,
    alternates: {
      canonical: `/categories/${params.categoria}`,
    }
  };
}

const TXT_INICI = 'Inici';
const TXT_CATEGORIES = 'Categories';
const TXT_ACTIVITATS_DE = 'Activitats de ';
const TXT_SENSE_ACTIVITATS = 'No hi ha activitats llistades per aquesta categoria encara.';

export default async function CategoriaPage({ params }: { params: { categoria: string } }) {
  const activitats = await getActivitatsByCategoria(params.categoria);
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const centresNames = Array.from(new Set(activitats.map(a => a.centre).filter(Boolean))).slice(0, 3).join(', ');
  const barrisNames = Array.from(new Set(activitats.map(a => a.barri).filter(Boolean))).slice(0, 4).join(', ');

  const faqLd = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Quines extraescolars de ${catDisplay} hi ha disponibles a Girona?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Actualment hi ha ${activitats.length} activitats de ${catDisplay} llistades a Girona, impartides en centres destacats com ara ${centresNames || 'diversos centres col\u00b7laboradors'}.`
        }
      },
      {
        "@type": "Question",
        "name": `A quins barris de Girona es fan activitats de ${catDisplay}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": barrisNames 
            ? `Es poden trobar activitats d'aquesta categoria en barris com ara ${barrisNames}.` 
            : `Hi ha activitats d'aquesta categoria distribu\u00efdes per diferents zones i barris de la ciutat de Girona.`
        }
      },
      {
        "@type": "Question",
        "name": `Com puc inscriure el meu fill a extraescolars de ${catDisplay}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Pots trobar tota la informaci\u00f3 detallada a cada fitxa d'activitat i posar-te en contacte directament amb el centre organitzador a trav\u00e9s del formulari de contacte, tel\u00e8fon o correu electr\u00f2nic indicats.`
        }
      }
    ]
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
      },
      faqLd
    ]
  };

  return (
    <>
      <Nav />
      <JsonLd data={combinedJsonLd as unknown as Record<string, unknown>} />
      <main id="main-content" style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
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
