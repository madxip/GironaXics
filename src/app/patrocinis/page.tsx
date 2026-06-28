"use client";

import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { sendInternalEmail } from '@/app/actions/sendEmail';

const CATEGORIES_LLISTA = [
  "Esports",
  "Idiomes",
  "Programació i robòtica",
  "Dansa",
  "Salut i benestar",
  "Ioga",
  "Música",
  "Creativitat i Expressió",
  "Teatre",
  "Naturalesa",
  "Escacs",
  "Cuina",
  "Lleure"
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Esports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
  "Idiomes": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop",
  "Programació i robòtica": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop",
  "Dansa": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop",
  "Salut i benestar": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop",
  "Ioga": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop",
  "Música": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
  "Creativitat i Expressió": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop",
  "Teatre": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=600&auto=format&fit=crop",
  "Naturalesa": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop",
  "Escacs": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop",
  "Cuina": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop",
  "Lleure": "https://images.unsplash.com/photo-1473177104440-ffee2f37e098?q=80&w=600&auto=format&fit=crop"
};

export default function PatrocinisPage() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [website, setWebsite] = useState('');
  
  // Real Form State (includes Mockup values synchronized)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    category: 'Esports',
    websiteUrl: '',
    bannerTitle: '',
    bannerDesc: '',
    message: ''
  });

  const [mockGradient, setMockGradient] = useState('1'); // 1: Verd GironaXics, 2: Daurat, 3: Blau, 4: Vermell Vi

  const getGradientStyle = (id: string) => {
    switch (id) {
      case '1': return 'linear-gradient(135deg, rgba(26, 107, 58, 0.25) 0%, rgba(9, 26, 15, 0.7) 100%)';
      case '2': return 'linear-gradient(135deg, rgba(179, 133, 27, 0.25) 0%, rgba(74, 54, 7, 0.7) 100%)';
      case '3': return 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.7) 100%)';
      case '4': return 'linear-gradient(135deg, rgba(136, 19, 55, 0.25) 0%, rgba(49, 4, 17, 0.7) 100%)';
      default: return 'linear-gradient(135deg, rgba(26, 107, 58, 0.25) 0%, rgba(9, 26, 15, 0.7) 100%)';
    }
  };

  const getGradientName = (id: string) => {
    switch (id) {
      case '1': return 'Verd GironaXics';
      case '2': return 'Daurat Premium';
      case '3': return 'Blau Elegant';
      case '4': return 'Vermell Vi';
      default: return 'Verd GironaXics';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.company && formData.email) {
      setStatus('sending');
      try {
        await sendInternalEmail({
          type: 'partner',
          nom: formData.name,
          empresaNom: formData.company,
          email: formData.email,
          missatge: `Categoria d'interès: ${formData.category}
Adreça web: ${formData.websiteUrl || 'No indicada'}
Color de fons del banner: ${getGradientName(mockGradient)}

Detalls del Banner Personalitzat:
- Títol: ${formData.bannerTitle || 'Mou-te amb...'}
- Descripció: ${formData.bannerDesc || 'Troba el millor equipament per a les teves extraescolars i campus d\'estiu a Girona.'}

Comentaris / Objectius:
${formData.message || 'Sense comentaris addicionals.'}`,
          website: website,
        });
        setStatus('ok');
        setSubmitted(true);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }
  };

  return (
    <>
      <Nav />
      
      {/* Estils locals del banner de sponsor igual que a Filtres.tsx */}
      <style>{`
        .sponsor-card-premium {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 380px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          color: white;
          border: 1px solid rgba(9, 26, 15, 0.35);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease;
          transform: translate3d(0, 0, 0);
        }
        .sponsor-card-premium:hover {
          transform: translate3d(0, -6px, 0);
          box-shadow: 0 25px 50px rgba(12, 34, 20, 0.35);
        }
        .sponsor-card-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.65) 100%);
          z-index: 1;
        }
        .sponsor-top-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background-color: var(--taronja, #f5a623);
          color: var(--verd-fosc, #0c2214);
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 6px 12px;
          border-radius: 30px;
          z-index: 2;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .sponsor-premium-content {
          position: relative;
          z-index: 2;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        .sponsor-premium-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0;
          line-height: 1.15;
        }
        .sponsor-premium-desc {
          font-family: var(--font-sans);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
          margin: 0 0 4px 0;
        }
        .sponsor-buttons-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sponsor-logo-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #f7f6f0;
          padding: 6px 16px 6px 8px;
          border-radius: 50px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .sponsor-logo-icon-mock {
          width: 30px;
          height: 30px;
          background-color: var(--verd-fosc);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          border: 1px solid rgba(0,0,0,0.08);
          flex-shrink: 0;
        }
        .sponsor-logo-text {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 800;
          color: var(--verd-fosc);
          letter-spacing: 0.05em;
        }
        .sponsor-cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--taronja);
          color: var(--verd-fosc);
          padding: 8px 16px;
          border-radius: 30px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(245, 166, 35, 0.2);
        }
        .sponsor-card-premium:hover .sponsor-cta-pill {
          background-color: white;
        }

        .mockup-builder-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          background-color: #ffffff;
          border: 1px solid var(--crema-fosca);
          border-radius: 16px;
          padding: 32px;
          margin: 40px 0;
          box-shadow: 0 10px 30px rgba(12, 34, 20, 0.03);
        }
        
        .mockup-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .mockup-controls label {
          font-size: 13px;
          font-weight: 700;
          color: var(--verd-fosc);
          margin-bottom: 4px;
          display: block;
        }

        .mockup-controls input, .mockup-controls textarea, .mockup-controls select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #eae6df;
          border-radius: 8px;
          background-color: #faf9f6;
          font-family: inherit;
          font-size: 14px;
          color: var(--fosc);
          transition: border-color 0.2s;
        }

        .mockup-controls input:focus, .mockup-controls textarea:focus {
          border-color: var(--verd);
          outline: none;
        }

        .gradient-selector {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .gradient-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .gradient-btn.active {
          border-color: var(--taronja);
          transform: scale(1.15);
        }

        @media (max-width: 768px) {
          .mockup-builder-grid {
            grid-template-columns: 1fr;
            padding: 20px;
            gap: 24px;
          }
        }
      `}</style>

      <main id="main-content" className="info-page" style={{ maxWidth: '1000px' }}>
        <header className="info-header">
          <span className="info-subtitle">Oportunitat exclusiva</span>
          <h1 className="info-title">Partners de Categoria</h1>
        </header>

        <section className="info-content">
          <p style={{ fontSize: '19px', lineHeight: '1.7', color: 'var(--verd-fosc)', textAlign: 'center', marginBottom: '40px' }}>
            Posiciona la teva marca davant de milers de famílies de Girona. Converteix-te en el Partner oficial i exclusiu d&apos;una de les nostres categories d&apos;activitats extraescolars.
          </p>

          <h2>Per què ser Partner de GironaXics?</h2>
          <p>
            GironaXics és el directori local de referència per a activitats infantils i familiars. Els nostres usuaris no busquen informació de passada; entren amb la intenció directa de triar i inscriure els seus fills a extraescolars, tallers i casals.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', margin: '40px 0' }}>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '12px', borderLeft: '4px solid var(--taronja)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>Exclusivitat Total</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>Només hi ha <strong>un partner per categoria</strong>. La teva marca serà l&apos;única que apareixerà a la secció patrocinada triada.</p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '12px', borderLeft: '4px solid var(--verd)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>Sticky Visibility</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>El teu banner es mantindrà **fix (sticky)** a la columna lateral en ordinadors mentre l&apos;usuari navega pels resultats de cerca.</p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '12px', borderLeft: '4px solid var(--verd-fosc)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>SEO i Trànsit Directe</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>El banner enllaça directament a la teva web o botiga, aportant autoritat SEO local i trànsit qualificat i llest per a convertir.</p>
            </div>
          </div>

          <h2>Crea la teva pròpia targeta de Partner</h2>
          <p>
            Posa a prova el nostre disseny premium. Escriu els valors de la teva marca a continuació i veuràs com es renderitza el teu patrocini en temps real dins dels nostres llistats de categories:
          </p>

          {/* MOCKUP BUILDER CONTAINER */}
          <div className="mockup-builder-grid">
            {/* Control Panel */}
            <div className="mockup-controls">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '22px', color: 'var(--verd-fosc)', margin: '0 0 12px' }}>Personalitza el banner</h3>
              
              <div>
                <label htmlFor="mockup-category-select">Categoria del banner</label>
                <select 
                  id="mockup-category-select"
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #eae6df', borderRadius: '8px', backgroundColor: '#faf9f6', color: '#0c2214', fontSize: '14px', fontFamily: 'inherit', marginBottom: '14px' }}
                >
                  {CATEGORIES_LLISTA.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mockup-title">Títol de la promoció (CTA)</label>
                <input 
                  id="mockup-title"
                  type="text" 
                  value={formData.bannerTitle} 
                  onChange={(e) => setFormData({ ...formData, bannerTitle: e.target.value })} 
                  placeholder="Mou-te amb..."
                  maxLength={40}
                />
              </div>

              <div>
                <label htmlFor="mockup-desc">Descripció o text comercial</label>
                <textarea 
                  id="mockup-desc"
                  rows={3} 
                  value={formData.bannerDesc} 
                  onChange={(e) => setFormData({ ...formData, bannerDesc: e.target.value })} 
                  placeholder="Troba el millor equipament per a les teves extraescolars i campus d'estiu a Girona."
                  maxLength={140}
                />
              </div>

              <div>
                <label htmlFor="mockup-brand">Nom de la teva Marca</label>
                <input 
                  id="mockup-brand"
                  type="text" 
                  value={formData.company} 
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                  placeholder="La teva marca"
                  maxLength={25}
                />
              </div>

              <div>
                <label>Color de fons de marca</label>
                <div className="gradient-selector">
                  <button 
                    aria-label="Verd GironaXics"
                    className={`gradient-btn ${mockGradient === '1' ? 'active' : ''}`} 
                    style={{ background: '#1A6B3A' }}
                    onClick={() => setMockGradient('1')}
                  />
                  <button 
                    aria-label="Daurat Premium"
                    className={`gradient-btn ${mockGradient === '2' ? 'active' : ''}`} 
                    style={{ background: '#b3851b' }}
                    onClick={() => setMockGradient('2')}
                  />
                  <button 
                    aria-label="Blau Elegant"
                    className={`gradient-btn ${mockGradient === '3' ? 'active' : ''}`} 
                    style={{ background: '#1e3a8a' }}
                    onClick={() => setMockGradient('3')}
                  />
                  <button 
                    aria-label="Vermell Vi"
                    className={`gradient-btn ${mockGradient === '4' ? 'active' : ''}`} 
                    style={{ background: '#881337' }}
                    onClick={() => setMockGradient('4')}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Render */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muted)', margin: '0 0 16px', textAlign: 'center' }}>VISTA PRÈVIA EN VIU</h3>
              
              <div 
                className="sponsor-card-premium" 
                style={{ 
                  backgroundImage: `${getGradientStyle(mockGradient)}, url(${CATEGORY_IMAGES[formData.category] || ''})`
                }}
              >
                <div className="sponsor-card-overlay"></div>
                <div className="sponsor-top-badge">PATROCINAT · {formData.category.toUpperCase()}</div>
                
                <div className="sponsor-premium-content">
                  <h4 className="sponsor-premium-title">{formData.bannerTitle || 'Mou-te amb...'}</h4>
                  <p className="sponsor-premium-desc">{formData.bannerDesc || 'Troba el millor equipament per a les teves extraescolars i campus d\'estiu a Girona.'}</p>
                  
                  <div className="sponsor-buttons-row">
                    <div className="sponsor-logo-pill">
                      <div className="sponsor-logo-icon-mock">
                        {formData.company ? formData.company.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <span className="sponsor-logo-text">{(formData.company || 'La teva marca').toUpperCase()}</span>
                    </div>
                    
                    <div className="sponsor-cta-pill">
                      <span>Més info</span>
                      <span className="arrow">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2>Sol·licita la teva Categoria com a Partner</h2>
          <p>
            T&apos;agradaria rebre els detalls de tarifes, condicions d&apos;exclusivitat i visites estimades per a la teva categoria? Deixa&apos;ns les teves dades i el nostre equip es posarà en contacte amb tu:
          </p>

          {submitted ? (
            <div style={{ backgroundColor: 'var(--verd-pallid, #e6f4ec)', border: '1px solid var(--verd, #1a6b3a)', padding: '32px', borderRadius: '12px', textAlign: 'center', color: 'var(--verd-fosc, #0c2214)', marginTop: '30px', boxShadow: '0 4px 15px rgba(26,107,58,0.05)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', marginBottom: '8px' }}>Sol·licitud enviada correctament!</h3>
              <p style={{ fontSize: '15px', margin: 0 }}>Moltes gràcies pel teu interès a ser Partner de GironaXics. Ens posarem en contacte amb tu en un termini de 24-48 hores per presentar-te la proposta detallada i verificar la disponibilitat de la categoria seleccionada.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" style={{ marginTop: '30px' }}>
              <div className="form-group">
                <label htmlFor="partner-name">Nom del contacte</label>
                <input
                  id="partner-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex. Marta Soler"
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-company">Nom de la teva Empresa o Marca</label>
                <input
                  id="partner-company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ex. Esports Soler"
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-email">Correu electrònic professional</label>
                <input
                  id="partner-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex. marta@esportssoler.cat"
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-website-url">Adreça web de l&apos;empresa (opcional)</label>
                <input
                  id="partner-website-url"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="Ex. https://www.esportssoler.cat"
                />
              </div>
              <div className="form-group">
                <label htmlFor="partner-category">Categoria que t&apos;interessa patrocinar</label>
                <select
                  id="partner-category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #eae6df', borderRadius: '8px', backgroundColor: '#faf9f6', color: '#0c2214' }}
                >
                  {CATEGORIES_LLISTA.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="partner-message">Comentaris o objectius de marca (opcional)</label>
                <textarea
                  id="partner-message"
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Explica'ns breument què comercialitzeu i quins productes o serveis us agradaria promocionar."
                />
              </div>

              {/* Honeypot field (hidden from humans, filled by bots) */}
              <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }} aria-hidden="true">
                <label htmlFor="partner-website">Si us plau, no omplis aquest camp</label>
                <input
                  id="partner-website"
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {status === 'error' && (
                <p style={{ color: '#c0392b', fontSize: '14px', background: '#fde8e8', padding: '10px 14px', borderRadius: '4px', marginBottom: '15px' }}>
                  Hi ha hagut un error enviant la sol·licitud. Si us plau, torna-ho a provar o escriu-nos directament a hola@gironaxics.cat.
                </p>
              )}

              <button type="submit" disabled={status === 'sending'} className="btn-submit">
                {status === 'sending' ? 'Enviant...' : "Sol·licitar informació de patrocini →"}
              </button>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
