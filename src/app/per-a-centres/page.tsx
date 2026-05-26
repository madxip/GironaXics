"use client";

import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { sendInternalEmail } from '@/app/actions/sendEmail';

export default function PerACentres() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [website, setWebsite] = useState('');
  const [formData, setFormData] = useState({ name: '', centerName: '', email: '', details: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.centerName && formData.email && formData.details) {
      setStatus('sending');
      try {
        await sendInternalEmail({
          type: 'centre',
          nom: formData.name,
          centreNom: formData.centerName,
          email: formData.email,
          missatge: formData.details,
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
      <main id="main-content" className="info-page">
        <header className="info-header">
          <span className="info-subtitle">Col·labora</span>
          <h1 className="info-title">Per als centres</h1>
        </header>

        <section className="info-content">
          <p style={{ fontSize: '19px', lineHeight: '1.7', color: 'var(--verd-fosc)', textAlign: 'center', marginBottom: '40px' }}>
            Ets una acadèmia, club esportiu, escola d'idiomes o associació a Girona? GironaXics és el teu millor altaveu per arribar a les famílies que busquen exactament el que tu ofereixes.
          </p>

          <h2>Per què anunciar-se a GironaXics?</h2>
          <p>
            El nostre portal és visitat diàriament per centenars de pares i mares de la ciutat de Girona i rodalies amb una intenció molt clara: triar les activitats extraescolars dels seus fills.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', margin: '40px 0' }}>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '4px', borderLeft: '3px solid var(--taronja)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>Públic qualificat</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>Arriba directament a famílies de Girona en el moment exacte en què prenen la decisió de compra.</p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '4px', borderLeft: '3px solid var(--verd)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>Posicionament SEO</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>Millora la visibilitat digital del teu centre gràcies a l'alta rellevància local del nostre domini.</p>
            </div>
            <div style={{ padding: '24px', backgroundColor: 'var(--crema-fosca)', borderRadius: '4px', borderLeft: '3px solid var(--verd-fosc)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', margin: '0 0 10px', color: 'var(--verd-fosc)' }}>Fàcil gestió</h3>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--muted)' }}>Nosaltres ens encarreguem de pujar i actualitzar les teves dades des d'Airtable sense complicacions tècniques.</p>
            </div>
          </div>

          <h2>Com funciona el procés?</h2>
          <ol>
            <li><strong>Envia la teva sol·licitud:</strong> Omple el formulari següent amb les dades bàsiques del teu centre i de contacte.</li>
            <li><strong>Revisió:</strong> El nostre equip validarà la informació per garantir els estàndards de qualitat de la guia.</li>
            <li><strong>Alta al directori:</strong> Pujarem el teu centre i totes les teves activitats directament a la nostra base de dades. Començaràs a rebre contactes immediatament!</li>
          </ol>

          <h2 style={{ marginTop: '60px' }}>Uneix-te a GironaXics</h2>
          {submitted ? (
            <div style={{ backgroundColor: 'var(--verd-pallid)', border: '1px solid var(--verd)', padding: '32px', borderRadius: '4px', textAlign: 'center', color: 'var(--verd-fosc)', marginTop: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', marginBottom: '8px' }}>Sol·licitud enviada!</h3>
              <p style={{ fontSize: '15px', margin: 0 }}>Moltes gràcies per voler formar part de GironaXics. Ens posarem en contacte amb tu en un termini màxim de 48 hores laborables per confirmar les teves dades i donar-te d'alta.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" style={{ marginTop: '30px' }}>
              <div className="form-group">
                <label htmlFor="center-manager">Nom de la persona de contacte</label>
                <input
                  id="center-manager"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex. Joan Pujol"
                />
              </div>
              <div className="form-group">
                <label htmlFor="center-name">Nom del centre / associació</label>
                <input
                  id="center-name"
                  type="text"
                  required
                  value={formData.centerName}
                  onChange={e => setFormData({ ...formData, centerName: e.target.value })}
                  placeholder="Ex. Acadèmia d'Arts Girona"
                />
              </div>
              <div className="form-group">
                <label htmlFor="center-email">Correu electrònic professional</label>
                <input
                  id="center-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex. direccio@academia.cat"
                />
              </div>
              <div className="form-group">
                <label htmlFor="center-details">Explica'ns breument quines activitats oferiu</label>
                <textarea
                  id="center-details"
                  rows={4}
                  required
                  value={formData.details}
                  onChange={e => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Dansa creativa, teatre musical, idiomes per a primària..."
                />
              </div>

              {/* Honeypot field (hidden from humans, filled by bots) */}
              <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }} aria-hidden="true">
                <label htmlFor="center-website">Si us plau, no omplis aquest camp</label>
                <input
                  id="center-website"
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
                {status === 'sending' ? 'Enviant...' : "Enviar sol·licitud d'alta →"}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
