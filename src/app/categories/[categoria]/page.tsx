import { Metadata } from 'next';
import { getActivitatsByCategoria } from '@/lib/airtable';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Extraescolars de ${catDisplay} a Girona | GironaXics`,
    description: `Totes les extraescolars de ${catDisplay} per a nens a Girona. Troba la millor opció.`
  };
}

export default async function CategoriaPage({ params }: { params: { categoria: string } }) {
  const activitats = await getActivitatsByCategoria(params.categoria);
  const catDisplay = params.categoria.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <Nav />
      <main style={{ padding: '120px 20px 60px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inici</Link> / 
            <span style={{ marginLeft: '8px' }}>Categories</span> / 
            <span style={{ marginLeft: '8px' }}>{catDisplay}</span>
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1, marginBottom: '40px' }}>
            Activitats de {catDisplay}
        </h1>

        <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {activitats.length > 0 ? (
                activitats.map(a => (
                    <ActivitatCard key={a.slug} activitat={a} />
                ))
            ) : (
                <div className="results-empty" style={{ gridColumn: '1 / -1' }}>No hi ha activitats llistades per aquesta categoria encara.</div>
            )}
        </div>
      </main>
      <Footer />
    </>
  );
}
