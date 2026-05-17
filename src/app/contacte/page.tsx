"use client";

import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function Contacte() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      // In a real application, you would send this to an API route (e.g. resend)
    }
  };

  return (
    <>
      <Nav />
      <main className="info-page">
        <header className="info-header">
          <span className="info-subtitle">Parlem-ne</span>
          <h1 className="info-title">Contacte</h1>
        </header>

        <section className="info-content">
          <p style={{ textAlign: 'center', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Tens algun dubte sobre el nostre portal? Vols proposar una millora o col·laborar amb nosaltres? Escriu-nos i et respondrem al més aviat possible.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginTop: '60px' }}>
            <div>
              <h2>Informació de contacte</h2>
              <p style={{ marginBottom: '16px' }}>
                <strong>Correu electrònic:</strong><br />
                <a href="mailto:hola@gironaxics.cat" style={{ color: 'var(--verd)', textDecoration: 'none', fontWeight: '500' }}>hola@gironaxics.cat</a>
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong>Ets un centre o club?</strong><br />
                Si vols registrar la teva acadèmia o associació, recorda que pots visitar la nostra secció específica per a centres on trobaràs tota la informació.
              </p>
              <p>
                <strong>Àmbit d'actuació:</strong><br />
                Girona, Catalunya
              </p>
            </div>

            <div>
              <h2>Envia'ns un missatge</h2>
              {submitted ? (
                <div style={{ backgroundColor: 'var(--verd-pallid)', border: '1px solid var(--verd)', padding: '24px', borderRadius: '4px', textAlign: 'center', color: 'var(--verd-fosc)' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '24px', marginBottom: '8px' }}>Missatge enviat!</h3>
                  <p style={{ fontSize: '14px', margin: 0 }}>Moltes gràcies per posar-te en contacte. Ens posarem en contacte amb tu molt aviat.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="contact-name">Nom complet</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="El teu nom"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email">Correu electrònic</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="hola@exemple.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-message">Missatge</label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Explica'ns en què et podem ajudar..."
                    />
                  </div>
                  <button type="submit" className="btn-submit">Enviar missatge →</button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
