export const revalidate = 3600; // revalida cada hora

import { Metadata } from 'next';
import { getActivitats, normalizeSlug } from '@/lib/airtable';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import MapaBarris from '@/components/MapaBarris';
import Link from 'next/link';

export async function generateStaticParams() {
  const activitats = await getActivitats();
  const barris = new Set<string>();
  activitats.forEach(a => { if (a.barri) barris.add(normalizeSlug(a.barri)); });
  barris.add('tots');
  return Array.from(barris).map(barri => ({ barri }));
}

export async function generateMetadata({ params }: { params: { barri: string } }): Promise<Metadata> {
  const barriDisplay = params.barri.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Extraescolars a ${barriDisplay}, Girona | GironaXics`,
    description: `Descobreix totes les activitats extraescolars pel teu fill al barri de ${barriDisplay}, Girona.`
  };
}

export default async function BarriPage({ params }: { params: { barri: string } }) {
  const activitats = await getActivitats();
  const barriDisplay = params.barri === 'tots' ? 'Girona' : params.barri.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <>
      <Nav />
      <main style={{ padding: '120px 0 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
                <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inici</Link> / 
                <span style={{ marginLeft: '8px' }}>Barris</span> / 
                <span style={{ marginLeft: '8px' }}>{barriDisplay}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '48px', color: 'var(--verd-fosc)', lineHeight: 1.1 }}>
                Activitats a {barriDisplay}
            </h1>
        </div>
        <MapaBarris activitats={activitats} activeBarri={params.barri === 'tots' ? 'Tots' : params.barri} />
      </main>
      <Footer />
    </>
  );
}
