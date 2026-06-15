export const revalidate = 86400; // revalida cada 24h

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCentreBySlug, getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';


export async function generateStaticParams() {
  const activitats = await getActivitats();
  const centres = new Set<string>();
  activitats.forEach(a => { if (a.centre) centres.add(normalizeSlug(a.centre)); });
  return Array.from(centres).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const centre = await getCentreBySlug(params.slug);
  if (!centre) return {};

  return {
    title: `Activitats extraescolars a ${centre.nom} | GironaXics`,
    description: `Totes les activitats extraescolars ofertes per ${centre.nom} a Girona. Troba la millor opció.`,
    alternates: {
      canonical: `/centres/${params.slug}`,
    }
  };
}

const TXT_INICI = 'Inici';
const TXT_CENTRES = 'Centres';
const TXT_DADES_CONTACTE = 'Dades de contacte';
const TXT_ADRECA = 'Adreça:';
const TXT_TELEFON = 'Telèfon:';
const TXT_EMAIL = 'Email:';
const TXT_SENSE_CONTACTE = 'Contacteu amb el centre per més informació.';
const TXT_ACTIVITATS_AQUEST_CENTRE = 'Activitats en aquest centre';
const TXT_SENSE_ACTIVITATS = 'Aquest centre no té activitats llistades encara.';

export default async function CentrePage({ params }: { params: { slug: string } }) {
  const centre = await getCentreBySlug(params.slug);
  if (!centre) notFound();

  const allActivitats = await getActivitats();
  const activitatsCentre = allActivitats.filter(a => normalizeSlug(a.centre) === params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": centre.nom,
    "description": centre.descripcio || `Centre d'activitats extraescolars a Girona: ${centre.nom}`,
    "url": centre.web || `https://gironaxics.cat/centres/${centre.slug}`,
    ...(centre.adreca && {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": centre.adreca,
        "addressLocality": "Girona",
        "addressRegion": "Girona",
        "postalCode": "17001",
        "addressCountry": "ES"
      }
    }),
    ...(centre.telefon && { "telephone": centre.telefon }),
    ...(centre.email && { "email": centre.email }),
    ...(centre.imatgeUrl && { "image": centre.imatgeUrl })
  };

  return (
    <>
      <Nav />
      <JsonLd data={jsonLd} />
      <main id="main-content" style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>{TXT_INICI}</Link> / 
            <span style={{ marginLeft: '8px' }}>{TXT_CENTRES}</span> / 
            <span style={{ marginLeft: '8px' }}>{centre.nom}</span>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1, marginBottom: '20px' }}>
            {centre.nom}
        </h1>

        <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'white', border: '1px solid var(--crema-fosca)', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--fosc)', marginBottom: '16px' }}>{TXT_DADES_CONTACTE}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', color: 'var(--muted)' }}>
                {centre.adreca && <div><strong>{TXT_ADRECA}</strong> {centre.adreca}</div>}
                {centre.telefon && <div><strong>{TXT_TELEFON}</strong> {centre.telefon}</div>}
                {centre.email && <div><strong>{TXT_EMAIL}</strong> {centre.email}</div>}
                {!centre.adreca && !centre.telefon && !centre.email && <div>{TXT_SENSE_CONTACTE}</div>}
            </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
            {TXT_ACTIVITATS_AQUEST_CENTRE}
        </h2>

        <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {activitatsCentre.length > 0 ? (
                activitatsCentre.map(a => (
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
