export const revalidate = 3600;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCentreBySlug, getActivitats } from '@/lib/airtable';
import { normalizeSlug } from '@/lib/utils';
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
    description: `Totes les activitats extraescolars ofertes per ${centre.nom} a Girona. Troba la millor opció.`
  };
}

export default async function CentrePage({ params }: { params: { slug: string } }) {
  const centre = await getCentreBySlug(params.slug);
  if (!centre) notFound();

  const allActivitats = await getActivitats();
  const activitatsCentre = allActivitats.filter(a => normalizeSlug(a.centre) === params.slug);

  return (
    <>
      <Nav />
      <main style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inici</Link> / 
            <span style={{ marginLeft: '8px' }}>Centres</span> / 
            <span style={{ marginLeft: '8px' }}>{centre.nom}</span>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1, marginBottom: '20px' }}>
            {centre.nom}
        </h1>

        <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: 'white', border: '1px solid var(--crema-fosca)', borderRadius: '4px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--fosc)', marginBottom: '16px' }}>Dades de contacte</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', color: 'var(--muted)' }}>
                {centre.adreça && <div><strong>Adreça:</strong> {centre.adreça}</div>}
                {centre.telefon && <div><strong>Telèfon:</strong> {centre.telefon}</div>}
                {centre.email && <div><strong>Email:</strong> {centre.email}</div>}
                {!centre.adreça && !centre.telefon && !centre.email && <div>Contacteu amb el centre per més informació.</div>}
            </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
            Activitats en aquest centre
        </h2>

        <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {activitatsCentre.length > 0 ? (
                activitatsCentre.map(a => (
                    <ActivitatCard key={a.slug} activitat={a} />
                ))
            ) : (
                <div className="results-empty" style={{ gridColumn: '1 / -1' }}>Aquest centre no té activitats llistades encara.</div>
            )}
        </div>
      </main>
      <Footer />
    </>
  );
}
