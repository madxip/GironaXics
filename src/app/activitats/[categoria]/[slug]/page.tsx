export const revalidate = 3600; // revalida cada hora

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { getActivitatBySlug, getActivitats, getCentres } from '@/lib/airtable';
import { normalizeSlug, safeJsonLd, formatPreu } from '@/lib/utils';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import CloseButton from '@/components/CloseButton';
import Galeria from '@/components/Galeria';
import ContactModal from '@/components/ContactModal';

export async function generateStaticParams() {
  const activitats = await getActivitats();
  return activitats
    .filter(a => a.categoria && a.slug)
    .map((activitat) => ({
      categoria: normalizeSlug(activitat.categoria),
      slug: activitat.slug,
    }));
}

export async function generateMetadata({ params }: { params: { categoria: string, slug: string } }): Promise<Metadata> {
  const activitat = await getActivitatBySlug(params.slug);
  if (!activitat) return {};

  // Construïm un meta description superric, dinàmic i optimitzat per a Google SEO
  let metaDesc = `${activitat.nom} per a nens de ${activitat.edat} a ${activitat.centre}.`;
  
  if (activitat.descripcio) {
    // Agafem la primera frase de la descripció per a donar context orgànic
    const firstSentence = activitat.descripcio.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10) {
      metaDesc += ` ${firstSentence}.`;
    }
  }

  // Afegim dies i horari si hi són
  if (activitat.dies) {
    if (activitat.horari) {
      metaDesc += ` ${activitat.dies} de ${activitat.horari}.`;
    } else {
      metaDesc += ` ${activitat.dies}.`;
    }
  }

  // Afegim preu formatat
  if (activitat.preu != null && String(activitat.preu).trim() !== '') {
    const formattedPreu = formatPreu(activitat.preu);
    metaDesc += ` Preu: ${formattedPreu}.`;
  }

  // Tallem amb cura per no deixar paraules a mitges (màxim ~155-160 caràcters recomanat per Google)
  if (metaDesc.length > 158) {
    const sliced = metaDesc.slice(0, 155);
    const lastSpace = sliced.lastIndexOf(' ');
    metaDesc = (lastSpace > 110 ? sliced.slice(0, lastSpace) : sliced) + '...';
  }

  return {
    title: `Activitats i extraescolars de ${activitat.nom} a ${activitat.barri}, Girona | GironaXics`,
    description: metaDesc,
    alternates: {
      canonical: `/activitats/${params.categoria}/${params.slug}`,
    },
    openGraph: {
      title: `Activitats i extraescolars de ${activitat.nom} a ${activitat.barri}, Girona | GironaXics`,
      description: metaDesc,
      type: 'article',
      locale: 'ca_ES',
    }
  };
}

const TXT_INICI = 'Inici';
const TXT_SENSE_DESCRIPCIO = 'Aquesta activitat no té cap descripció detallada encara. El centre pot afegir-ne més aviat.';
const TXT_PREU = 'Preu:';
const TXT_IMPARTIT_PER = 'Impartit per';
const TXT_HORARI = 'Horari';
const TXT_DIES = 'Dies';
const TXT_DURADA = 'Durada';
const TXT_IDIOMA = 'Idioma';
const TXT_SENSE_CONTACTE = 'Contacteu amb el centre per més informació.';
const TXT_WEB_CENTRE = 'Visita la web del centre ↗';
const TXT_SENSE_CONTACTE_DADES = 'Sense dades de contacte';
const TXT_MES_ACTIVITATS_A = 'Més activitats a ';
const TXT_ALTRES_ACTIVITATS_A = 'Altres activitats a ';

function parseMarkdownToReact(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    const bulletRegex = /^(\s*[-*•]\s+)(.*)/;
    const matchBullet = line.match(bulletRegex);
    
    const parseInline = (inlineText: string) => {
      const boldParts = inlineText.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        const isBold = bIdx % 2 !== 0;
        const italicParts = bPart.split(/\*([^*_]+)\*/g);
        const renderedItalics = italicParts.map((iPart, iIdx) => {
          const isItalic = iIdx % 2 !== 0;
          if (isItalic) {
            return <em key={iIdx}>{iPart}</em>;
          }
          return iPart;
        });
        
        if (isBold) {
          return <strong key={bIdx}>{renderedItalics}</strong>;
        }
        return <span key={bIdx}>{renderedItalics}</span>;
      });
    };
    
    if (matchBullet) {
      const content = matchBullet[2];
      return (
        <ul key={lineIdx} style={{ margin: '4px 0 4px 24px', padding: 0, listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>
            {parseInline(content)}
          </li>
        </ul>
      );
    }
    
    if (line.trim() === '') {
      return <div key={lineIdx} style={{ height: '0.8em' }} />;
    }
    
    return (
      <p key={lineIdx} style={{ margin: '0 0 10px 0' }}>
        {parseInline(line)}
      </p>
    );
  });
}

export default async function ActivitatPage({ params }: { params: { categoria: string, slug: string } }) {
  const activitats = await getActivitats();
  const normalizedSearchSlug = normalizeSlug(decodeURIComponent(params.slug));
  const activitat = activitats.find(a => normalizeSlug(a.slug) === normalizedSearchSlug);
  if (!activitat) notFound();

  // Try to find center data
  const centres = await getCentres();
  const centre = centres.find(c => c.slug === normalizeSlug(activitat.centre) || (c.nom && normalizeSlug(c.nom) === normalizeSlug(activitat.centre))) || null;
  const logoUrl = activitat.centreImatgeUrl || centre?.imatgeUrl || null;

  const contactTelefon = centre?.telefon ?? null;
  const safeWeb = (centre?.web && /^https?:\/\//i.test(centre.web)) ? centre.web : null;

  const totesBarri = activitats.filter(a => normalizeSlug(a.barri) === normalizeSlug(activitat.barri));
  const altresBarri = totesBarri.filter(a => a.slug !== activitat.slug).slice(0, 3);

  const totesCentre = activitats.filter(a => normalizeSlug(a.centre) === normalizeSlug(activitat.centre));
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
      <script type="application/ld+json" {...{ dangerouslySetInnerHTML: { __html: safeJsonLd(jsonLd) } }} />

      <main id="main-content" style={{ paddingBottom: '60px' }}>
        <div className="modal-hero" style={{ position: 'relative' }}>
          {/* Aprofitem la imatge pujada a Airtable, o deixem el placeholder de disseny si no n'hi ha cap */}
          <SafeImage src={activitat.imatgeUrl || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2000&auto=format&fit=crop"} alt={activitat.nom} fill style={{ objectFit: 'cover' }} priority />
          <div className="modal-hero-gradient">
            <h1 className="modal-hero-title">{activitat.nom}</h1>
          </div>
          <div className="modal-badge">
            {activitat.subcategoria ? `${activitat.categoria} · ${activitat.subcategoria}` : activitat.categoria}
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 0' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', marginBottom: '24px', opacity: 0.6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>{TXT_INICI}</Link> /
            <Link href={`/categories/${params.categoria}`} style={{ color: 'inherit', textDecoration: 'none', marginLeft: '8px' }}>{activitat.categoria}</Link> /
            {activitat.subcategoria && (
              <>
                <span style={{ marginLeft: '8px', marginRight: '8px' }}>{activitat.subcategoria}</span> /
              </>
            )}
            <span style={{ marginLeft: '8px' }}>{activitat.nom}</span>
          </div>

          <div style={{ fontSize: '20px', fontFamily: 'var(--font-sans)', color: 'var(--muted)', marginBottom: '40px' }}>
            {altresCentre.length > 0 ? (
              <a href="#activitats-centre" className="hoverable" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted var(--muted)' }}>{activitat.centre}</a>
            ) : (
              activitat.centre
            )} · {activitat.barri ? (
              <Link href={`/barris/${normalizeSlug(activitat.barri)}`} className="hoverable" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted var(--muted)' }}>
                {activitat.barri}
              </Link>
            ) : null} · {activitat.edat}
          </div>

          <div className="grid-12 detail-grid" style={{ marginBottom: '60px' }}>
            <div className="detail-col-left" style={{ gridColumn: 'span 6', paddingRight: '40px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', lineHeight: 1.6, color: 'var(--fosc)' }}>
                {activitat.descripcio ? parseMarkdownToReact(activitat.descripcio) : TXT_SENSE_DESCRIPCIO}
              </div>
              {activitat.material && (
                <div style={{ 
                  marginTop: '32px', 
                  padding: '24px', 
                  backgroundColor: 'var(--crema-fosca)', 
                  borderLeft: '4px solid var(--verd)', 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: '16px', 
                  lineHeight: 1.5, 
                  color: 'var(--fosc)',
                  borderRadius: '0 4px 4px 0',
                  whiteSpace: 'pre-line'
                }}>
                  <strong style={{ display: 'block', color: 'var(--verd-fosc)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                    Observacions
                  </strong>
                  {activitat.material}
                </div>
              )}
              <Galeria images={activitat.galeria} nom={activitat.nom} />
            </div>

            <div className="detail-col-right" style={{ gridColumn: 'span 6' }}>
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', border: '1px solid var(--crema-fosca)' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--verd-fosc)', marginBottom: '24px' }}>
                  <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '6px', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--muted)' }}>{TXT_PREU}</strong>
                  {(() => {
                    const formatted = formatPreu(activitat.preu);
                    if (formatted.includes('/')) {
                      const [priceVal, priceUnit] = formatted.split('/');
                      return (
                        <>{priceVal} <span style={{ fontSize: '16px', fontWeight: 400, opacity: 0.6 }}>/{priceUnit}</span></>
                      );
                    }
                    return <>{formatted}</>;
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {activitat.qui_imparteix && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_IMPARTIT_PER}</strong>{activitat.qui_imparteix}</div>}
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_HORARI}</strong>{activitat.horari}</div>
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_DIES}</strong>{activitat.dies}</div>
                  {activitat.durada && activitat.durada.trim() !== "" && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_DURADA}</strong>{activitat.durada}</div>}
                  {activitat.idioma && activitat.idioma.trim() !== "" && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_IDIOMA}</strong>{activitat.idioma}</div>}
                </div>

                <div style={{ paddingTop: '24px', borderTop: '1px solid var(--crema-fosca)', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {logoUrl && (
                    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--crema-fosca)', backgroundColor: '#fcfcfc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SafeImage src={logoUrl} alt={activitat.centre} fill style={{ objectFit: 'contain', padding: '6px' }} />
                    </div>
                  )}
                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>
                      {altresCentre.length > 0 ? (
                        <a href="#activitats-centre" className="hoverable" style={{ color: 'inherit', textDecoration: 'none' }}>{activitat.centre}</a>
                      ) : (
                        activitat.centre
                      )}
                    </h3>
                    {centre ? (
                      <div style={{ fontSize: '14px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {centre.adreca && <div>{centre.adreca}</div>}
                        {centre.telefon && <div>{centre.telefon}</div>}
                        {centre.email && <div>{centre.email}</div>}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{TXT_SENSE_CONTACTE}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contactTelefon && (
                    <a href={`tel:${contactTelefon}`} className="hoverable" style={{ display: 'block', backgroundColor: 'var(--verd-fosc)', color: 'white', padding: '16px', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontWeight: 700 }}>
                      📞 {contactTelefon}
                    </a>
                  )}
                  {centre?.email ? (
                    <ContactModal
                      centreEmail={centre.email}
                      centreNom={activitat.centre}
                      activitatNom={activitat.nom}
                    />
                  ) : safeWeb ? (
                    <a href={safeWeb} target="_blank" rel="noopener noreferrer" className="hoverable" style={{ display: 'block', backgroundColor: 'var(--verd-fosc)', color: 'white', padding: '16px', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontWeight: 700 }}>
                      {TXT_WEB_CENTRE}
                    </a>
                  ) : !contactTelefon ? (
                    <div style={{ backgroundColor: 'var(--crema-fosca)', color: 'var(--muted)', padding: '16px', textAlign: 'center', borderRadius: '4px', fontWeight: 700, fontSize: '14px' }}>
                      {TXT_SENSE_CONTACTE_DADES}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {altresCentre.length > 0 && (
            <div id="activitats-centre" style={{ borderTop: '1px solid var(--crema-fosca)', paddingTop: '60px', paddingBottom: '60px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
                {TXT_MES_ACTIVITATS_A}{activitat.centre}
              </h2>
              <div className="modal-related-grid">
                {altresCentre.map(a => (
                  <ActivitatCard key={a.slug} activitat={a} />
                ))}
              </div>
            </div>
          )}

          {altresBarri.length > 0 && (
            <div style={{ borderTop: '1px solid var(--crema-fosca)', paddingTop: '60px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: 'var(--verd-fosc)', marginBottom: '32px' }}>
                {TXT_ALTRES_ACTIVITATS_A}{activitat.barri}
              </h2>
              <div className="modal-related-grid">
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
