export const revalidate = 3600; // revalida cada hora

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getActivitatBySlug, getActivitatsByBarri, getCentreBySlug, normalizeSlug, getActivitats } from '@/lib/airtable';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import CloseButton from '@/components/CloseButton';
import Galeria from '@/components/Galeria';

export async function generateMetadata({ params }: { params: { categoria: string, slug: string } }): Promise<Metadata> {
  const activitat = await getActivitatBySlug(params.slug);
  if (!activitat) return {};

  return {
    title: `${activitat.nom} a ${activitat.barri}, Girona | GironaXics`,
    description: `Aprèn ${activitat.nom} a ${activitat.centre}. Per a nens de ${activitat.edat}. ${activitat.preu != null && activitat.preu !== '' ? activitat.preu + '€/mes' : 'Preu a consultar'}. Troba totes les extraescolars de Girona a GironaXics.`.slice(0, 150),
    openGraph: {
      title: `${activitat.nom} a ${activitat.barri}, Girona | GironaXics`,
      description: `Aprèn ${activitat.nom} a ${activitat.centre}. Per a nens de ${activitat.edat}. ${activitat.preu != null && activitat.preu !== '' ? activitat.preu + '€/mes' : 'Preu a consultar'}. Troba totes les extraescolars de Girona a GironaXics.`.slice(0, 150),
      type: 'article',
      locale: 'ca_ES',
    }
  };
}

export default async function ActivitatPage({ params }: { params: { categoria: string, slug: string } }) {
  const activitat = await getActivitatBySlug(params.slug);
  if (!activitat) notFound();

  // Try to find center data
  const centre = await getCentreBySlug(normalizeSlug(activitat.centre));
  const contactLink = centre?.telefon ? `tel:${centre.telefon}` : (centre?.email ? `mailto:${centre.email}` : '#');

  const totesBarri = await getActivitatsByBarri(normalizeSlug(activitat.barri));
  const altresBarri = totesBarri.filter(a => a.slug !== activitat.slug).slice(0, 3);

  const totesCentre = (await getActivitats()).filter(a => normalizeSlug(a.centre) === normalizeSlug(activitat.centre));
  const altresCentre = totesCentre.filter(a => a.slug !== activitat.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": activitat.nom,
    "description": activitat.descripcio || `Activitats de ${activitat.nom} a ${activitat.barri}.`,
    "provider": {
      "@type": "LocalBusiness",
      "name": activitat.centre,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Girona"
      },
      ...(centre?.telefon && { "telephone": centre.telefon })
    },
    "offers": {
      "@type": "Offer",
      "price": activitat.preu,
      "priceCurrency": "EUR"
    }
  };

  return (
    <>
      <Nav />
      <CloseButton />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main style={{ paddingBottom: '60px' }}>
        <div className="modal-hero">
          {/* Aprofitem la imatge pujada a Airtable, o deixem el placeholder de disseny si no n'hi ha cap */}
          <img src={activitat.imatgeUrl || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2000&auto=format&fit=crop"} alt={activitat.nom} />
          <div className="modal-hero-gradient">
            <h1 className="modal-hero-title">{activitat.nom}</h1>
          </div>
          <div className="modal-badge">{activitat.categoria}</div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 0' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Inici</Link> /
            <Link href={`/categories/${params.categoria}`} style={{ color: 'inherit', textDecoration: 'none', marginLeft: '8px' }}>{activitat.categoria}</Link> /
            <span style={{ marginLeft: '8px' }}>{activitat.nom}</span>
          </div>

          <div style={{ fontSize: '20px', fontFamily: 'var(--font-sans)', color: 'var(--muted)', marginBottom: '40px' }}>
            {altresCentre.length > 0 ? (
              <a href="#activitats-centre" className="hoverable" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted var(--muted)' }}>{activitat.centre}</a>
            ) : (
              activitat.centre
            )} · {activitat.barri} · {activitat.edat}
          </div>

          <div className="grid-12" style={{ marginBottom: '60px' }}>
            <div style={{ gridColumn: 'span 6', paddingRight: '40px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', lineHeight: 1.6, color: 'var(--fosc)' }}>
                {activitat.descripcio || "Aquesta activitat no té cap descripció detallada encara. El centre pot afegir-ne més aviat."}
              </div>
              <Galeria images={activitat.galeria} />
            </div>

            <div style={{ gridColumn: 'span 6' }}>
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', border: '1px solid var(--crema-fosca)' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--verd-fosc)', marginBottom: '24px' }}>
                  {activitat.preu != null && activitat.preu !== '' ? (
                    <>{activitat.preu}€ <span style={{ fontSize: '16px', fontWeight: 400, opacity: 0.6 }}>/mes</span></>
                  ) : (
                    "A consultar"
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {activitat.qui_imparteix && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Impartit per</strong>{activitat.qui_imparteix}</div>}
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Horari</strong>{activitat.horari}</div>
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Dies</strong>{activitat.dies}</div>
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Durada</strong>{activitat.durada}</div>
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>Idioma</strong>{activitat.idioma}</div>
                </div>

                <div style={{ paddingTop: '24px', borderTop: '1px solid var(--crema-fosca)', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    {altresCentre.length > 0 ? (
                      <a href="#activitats-centre" className="hoverable" style={{ color: 'inherit', textDecoration: 'none' }}>{activitat.centre}</a>
                    ) : (
                      activitat.centre
                    )}
                  </h3>
                  {centre ? (
                    <div style={{ fontSize: '14px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {centre.adreça && <div>{centre.adreça}</div>}
                      {centre.telefon && <div>{centre.telefon}</div>}
                      {centre.email && <div>{centre.email}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Contacteu amb el centre per més informació.</div>
                  )}
                </div>

                <a href={contactLink} className="hoverable" style={{ display: 'block', backgroundColor: 'var(--verd-fosc)', color: 'white', padding: '16px', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontWeight: 700 }}>
                  Contacta el centre
                </a>
              </div>
            </div>
          </div>

          {altresCentre.length > 0 && (
            <div id="activitats-centre" style={{ borderTop: '1px solid var(--crema-fosca)', paddingTop: '60px', paddingBottom: '60px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
                Més activitats a {activitat.centre}
              </h2>
              <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {altresCentre.map(a => (
                  <ActivitatCard key={a.slug} activitat={a} />
                ))}
              </div>
            </div>
          )}

          {altresBarri.length > 0 && (
            <div style={{ borderTop: '1px solid var(--crema-fosca)', paddingTop: '60px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
                Altres activitats a {activitat.barri}
              </h2>
              <div className="results-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {altresBarri.map(a => (
                  <ActivitatCard key={a.slug} activitat={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
