export const revalidate = 86400; // revalida cada 24h

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import HeroImage from '@/components/HeroImage';
import { getActivitatBySlug, getActivitats, getCentres } from '@/lib/airtable';
import { normalizeSlug, safeJsonLd, formatPreu, parseMultiPreu } from '@/lib/utils';
import { isTallerExpiredOrEnded } from '@/lib/tallerDates';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ActivitatCard from '@/components/ActivitatCard';
import CloseButton from '@/components/CloseButton';
import Galeria from '@/components/Galeria';
import ContactModal from '@/components/ContactModal';
import TrackActivityView from '@/components/TrackActivityView';
import ContactPhoneButton from '@/components/ContactPhoneButton';

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
const TXT_MES_TALLERS_A = 'Més tallers a ';
const TXT_ALTRES_ACTIVITATS_A = 'Altres activitats a ';

// Mesos en català
const MESOS_CAT = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

function parseTorns(torns: string) {
  const lines = torns.split('\n').map(l => l.trim()).filter(Boolean);
  const byMonth = new Map<string, { monthIdx: number; items: { num: number; inici: string; fi: string }[] }>();
  let tornNum = 1;
  lines.forEach(line => {
    // Accepta formats: "22/6/26-26/6/26", "22/6/26 - 26/6/26", "TORN X: DEL 22/6/26 AL 26/6/26"
    const m = line.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\s*(?:[-–]|AL|al)\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/i);
    if (!m) return;
    const [, d1, mo1, y1, d2, mo2, y2] = m;
    const monthIdx = parseInt(mo1, 10) - 1;
    const monthName = MESOS_CAT[monthIdx] || `Mes ${mo1}`;
    if (!byMonth.has(monthName)) byMonth.set(monthName, { monthIdx, items: [] });
    byMonth.get(monthName)!.items.push({ num: tornNum++, inici: `${d1}/${mo1}/${y1}`, fi: `${d2}/${mo2}/${y2}` });
  });
  return Array.from(byMonth.entries()).sort((a, b) => a[1].monthIdx - b[1].monthIdx);
}


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

function formatMultilineText(text: string) {
  if (!text) return null;
  const lines = text.split(/\r?\n|\s+\/\s+/).map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <span style={{ whiteSpace: 'pre-line' }}>{text}</span>;
  }
  return (
    <ul style={{ listStyleType: 'none', padding: 0, margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {lines.map((line, idx) => (
        <li key={idx} style={{ fontSize: '14px', position: 'relative', paddingLeft: '14px', lineHeight: '1.4' }}>
          <span style={{ position: 'absolute', left: 0, top: '8px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--verd, #1a6b3a)' }} />
          {line}
        </li>
      ))}
    </ul>
  );
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

  const isTaller = activitat.tipus?.toLowerCase().includes('taller');

  // ── Secció CENTRE ──────────────────────────────────────────────────────────
  // Totes les activitats del centre excepte la pròpia (exclou tallers expirats)
  const totesCentre = activitats.filter(a =>
    a.slug !== activitat.slug &&
    normalizeSlug(a.centre) === normalizeSlug(activitat.centre) &&
    !(a.tipus?.toLowerCase().includes('taller') && isTallerExpiredOrEnded(a.dies || ''))
  );
  // Si veiem un taller: mostra primer els altres tallers del centre
  const tallersCentre = totesCentre.filter(a => a.tipus?.toLowerCase().includes('taller'));
  const altresCentre = isTaller
    ? (tallersCentre.length > 0 ? tallersCentre : totesCentre)
    : totesCentre;

  // ── Secció BARRI ───────────────────────────────────────────────────────────
  // Totes les activitats del barri excepte la pròpia (exclou tallers expirats)
  const totesBarri = activitats.filter(a =>
    a.slug !== activitat.slug &&
    normalizeSlug(a.barri) === normalizeSlug(activitat.barri) &&
    !(a.tipus?.toLowerCase().includes('taller') && isTallerExpiredOrEnded(a.dies || ''))
  );
  const tallersBarri = totesBarri.filter(a => a.tipus?.toLowerCase().includes('taller'));
  // Tallers: prefereix altres tallers del barri (max 6), fallback a totes
  // Altres: max 3 com fins ara
  const altresBarri = isTaller
    ? (tallersBarri.length > 0 ? tallersBarri.slice(0, 6) : totesBarri.slice(0, 6))
    : totesBarri.slice(0, 3);
  // Títol dinàmic per a la secció de barri
  const titolBarri = isTaller
    ? (tallersBarri.length > 0 ? TXT_MES_TALLERS_A : TXT_ALTRES_ACTIVITATS_A)
    : TXT_ALTRES_ACTIVITATS_A;

  const baseUrl = 'https://gironaxics.cat';
  const catSlug = normalizeSlug(activitat.categoria || 'altres');

  const courseLd = {
    "@type": "Course",
    "name": activitat.nom,
    "description": activitat.descripcio || `Activitats de ${activitat.nom} a ${activitat.barri}.`,
    "educationalLevel": activitat.edat,
    "provider": {
      "@type": "LocalBusiness",
      "name": activitat.centre,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Girona"
      },
      ...(centre?.telefon && { "telephone": centre.telefon })
    },
    "location": {
      "@type": "Place",
      "name": activitat.centre,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Girona"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": activitat.preu,
      "priceCurrency": "EUR"
    }
  };

  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inici",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": activitat.categoria || "Categories",
        "item": `${baseUrl}/categories/${catSlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": activitat.nom,
        "item": `${baseUrl}/activitats/${catSlug}/${activitat.slug}`
      }
    ]
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      courseLd,
      breadcrumbLd
    ]
  };

  return (
    <>
      <TrackActivityView activitatId={activitat.id!} activitatNom={activitat.nom} />
      <Nav />
      <CloseButton />
      <script type="application/ld+json" {...{ dangerouslySetInnerHTML: { __html: safeJsonLd(combinedJsonLd) } }} />

      <main id="main-content" style={{ paddingTop: 'var(--nav-height)', paddingBottom: '60px' }}>
        <div className="modal-hero" style={{ position: 'relative' }}>
          <HeroImage
            src={activitat.imatgeUrl || "/placeholder-activitat.svg"}
            alt={activitat.nom}
          />
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
                }}>
                  <strong style={{ display: 'block', color: 'var(--verd-fosc)', marginBottom: '8px', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                    Observacions
                  </strong>
                  {parseMarkdownToReact(activitat.material)}
                </div>
              )}
              <Galeria images={activitat.galeria} nom={activitat.nom} />
            </div>

            <div className="detail-col-right" style={{ gridColumn: 'span 6' }}>
              <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', border: '1px solid var(--crema-fosca)' }}>
                <div style={{ marginBottom: '24px' }}>
                  <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '6px', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--muted)' }}>{TXT_PREU}</strong>
                  {(() => {
                    const formatted = formatPreu(activitat.preu);
                    // Si conté | o salts de línia \n és un preu multi-opció
                    if (formatted.includes('|') || formatted.includes('\n')) {
                      const items = parseMultiPreu(formatted);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {items.map((item, i) => {
                            if (item.type === 'header') {
                              return (
                                <div key={i} style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 800, 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.08em', 
                                  color: 'var(--verd)', 
                                  marginTop: i > 0 ? '12px' : '0',
                                  paddingBottom: '4px',
                                  borderBottom: '1.5px solid rgba(12, 34, 20, 0.15)'
                                }}>
                                  {item.text}
                                </div>
                              );
                            }
                            return (
                              <div key={i} style={{ 
                                display: 'flex', 
                                alignItems: 'baseline', 
                                justifyContent: 'space-between', 
                                gap: '12px',
                                paddingBottom: '6px',
                                borderBottom: '1px dashed rgba(0,0,0,0.08)'
                              }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--verd-fosc)' }}>
                                  {item.concept}
                                </span>
                                {item.price && (
                                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--verd-fosc)', whiteSpace: 'nowrap' }}>
                                    {item.price}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    // Preu llarg sense | (text descriptiu)
                    if (formatted.length > 20) {
                      return <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--verd-fosc)' }}>{formatted}</span>;
                    }
                    // Preu simple (número o text curt)
                    if (formatted.includes('/')) {
                      const [priceVal, priceUnit] = formatted.split('/');
                      return (
                        <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--verd-fosc)' }}>
                          {priceVal} <span style={{ fontSize: '16px', fontWeight: 400, opacity: 0.6 }}>/{priceUnit}</span>
                        </span>
                      );
                    }
                    return <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--verd-fosc)' }}>{formatted}</span>;
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {activitat.qui_imparteix && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_IMPARTIT_PER}</strong>{activitat.qui_imparteix}</div>}
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_HORARI}</strong>{formatMultilineText(activitat.horari)}</div>
                  <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_DIES}</strong>{formatMultilineText(activitat.dies)}</div>
                  {activitat.durada && activitat.durada.trim() !== "" && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_DURADA}</strong>{formatMultilineText(activitat.durada)}</div>}
                  {activitat.idioma && activitat.idioma.trim() !== "" && <div><strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>{TXT_IDIOMA}</strong>{activitat.idioma}</div>}
                  {activitat.torns && activitat.torns.trim() && (
                    <div>
                      <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5, marginBottom: '12px' }}>Torns i Dates</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {parseTorns(activitat.torns).map(([month, { items }]) => (
                          <div key={month}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--verd)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</div>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {items.map((t: { num: number; inici: string; fi: string }) => (
                                <li key={t.num} style={{ fontSize: '14px' }}>
                                  <span style={{ fontWeight: 600 }}>Torn {t.num}:</span> del {t.inici} al {t.fi}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <ContactPhoneButton
                      telefon={contactTelefon}
                      activitatNom={activitat.nom}
                      activitatId={activitat.id}
                    />
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
                {titolBarri}{activitat.barri}
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
