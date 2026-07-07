export const revalidate = 86400; // revalida cada 24h

import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getActivitats } from '@/lib/airtable';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cerca | GironaXics',
  description: 'Cerca activitats extraescolars a Girona.',
};

const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default async function CercaPage({ searchParams }: { searchParams: { q?: string } }) {
  const queryRaw = searchParams.q || '';
  const queryNormalized = removeAccents(queryRaw.toLowerCase());
  const all = await getActivitats();
  
  const filtered = queryNormalized 
    ? all.filter(a => 
        removeAccents((a.nom || '').toLowerCase()).includes(queryNormalized) || 
        removeAccents((a.centre || '').toLowerCase()).includes(queryNormalized) ||
        removeAccents((a.descripcio || '').toLowerCase()).includes(queryNormalized) ||
        removeAccents((a.barri || '').toLowerCase()).includes(queryNormalized) ||
        (a.categories || [a.categoria || '']).some((c: string) => removeAccents(c.toLowerCase()).includes(queryNormalized))
      )
    : all;

  return (
    <>
      <Nav />
      <main id="main-content" style={{ padding: '140px 5vw 80px', minHeight: '80vh', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inici</Link> /
            <span style={{ marginLeft: '8px' }}>Cerca</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', marginBottom: '40px' }}>
          {queryRaw ? <>Resultats per: &ldquo;{searchParams.q}&rdquo;</> : "Cerca"}
        </h1>

        {filtered.length === 0 ? (
          <div className="results-empty" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--crema-fosca)', borderRadius: '4px' }}>
             No hem trobat cap activitat que coincideixi amb &ldquo;{searchParams.q}&rdquo;.
             <div style={{ marginTop: '24px' }}>
                <Link href="/" className="hoverable" style={{ color: 'var(--verd-fosc)', textDecoration: 'none', fontWeight: 700, borderBottom: '1px solid var(--verd)' }}>
                  Torna a l&apos;inici per veure totes les activitats
                </Link>
             </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '32px' }}>
              S&apos;han trobat {filtered.length} {filtered.length === 1 ? 'activitat' : 'activitats'}
            </div>
            <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                {filtered.map(a => (
                <div key={a.slug} style={{ borderBottom: '1px solid var(--crema-fosca)', paddingBottom: '24px' }}>
                    <ActivitatCard activitat={a} />
                </div>
                ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
