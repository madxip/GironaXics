"use client";

import { useState, useEffect, useRef } from 'react';
import { sendContactEmail } from '@/app/actions/sendEmail';
import { trackEvent } from '@/lib/trackEvent';

interface Props {
  centreEmail: string;
  centreNom: string;
  activitatNom: string;
}

export default function ContactModal({ centreEmail, centreNom, activitatNom }: Props) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [missatge, setMissatge] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Tanca amb Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus trap
  useEffect(() => {
    if (!open) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(modalElement.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(el => el.offsetParent !== null); // Filter out hidden elements (like honeypot parent)

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus al primer camp quan s'obre
  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 60);
    else { setStatus('idle'); setNom(''); setEmail(''); setMissatge(''); setWebsite(''); }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await sendContactEmail({
        centreEmail,
        centreNom,
        activitatNom,
        nomRemitent: nom,
        emailRemitent: email,
        missatge,
        website
      });
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid var(--crema-fosca)',
    borderRadius: '4px', fontFamily: 'var(--font-sans)', fontSize: '15px',
    color: 'var(--fosc)', background: 'var(--crema)', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: 'var(--verd)', marginBottom: '6px',
  };

  return (
    <>
      {/* Botó principal */}
      <button
        onClick={() => {
          setOpen(true);
          trackEvent('contact_email', activitatNom, centreEmail);
        }}
        className="hoverable"
        style={{
          display: 'block', width: '100%',
          backgroundColor: 'var(--verd-fosc)', color: 'white',
          padding: '16px', textAlign: 'center', borderRadius: '4px',
          fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: '16px',
        }}
      >
        ✉ Envia un correu
      </button>

      {/* Overlay + Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(26,26,24,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          role="dialog" aria-modal="true" aria-label={`Contactar amb ${centreNom}`}
        >
          <div ref={modalRef} style={{
            background: 'var(--crema)', borderRadius: '8px', padding: '40px',
            width: '100%', maxWidth: '520px', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.25s ease',
          }}>
            {/* Tanca */}
            <button
              onClick={() => setOpen(false)} aria-label="Tanca"
              style={{
                position: 'absolute', top: '16px', right: '20px',
                background: 'none', border: 'none', fontSize: '22px',
                color: 'var(--muted)', cursor: 'pointer', lineHeight: 1,
              }}
            >✕</button>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', color: 'var(--verd-fosc)', marginBottom: '4px' }}>
              Contacta el centre
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '28px' }}>
              {centreNom} · {activitatNom}
            </p>

            {status === 'ok' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                <p style={{ fontWeight: 700, fontSize: '18px', color: 'var(--verd-fosc)', marginBottom: '8px' }}>Missatge enviat!</p>
                <p style={{ color: 'var(--muted)', fontSize: '14px' }}>El centre et respondrà al correu que has indicat.</p>
                <button onClick={() => setOpen(false)} style={{ marginTop: '24px', padding: '12px 28px', background: 'var(--verd-fosc)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Tancar</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle} htmlFor="contact-nom">El teu nom</label>
                  <input ref={firstInputRef} id="contact-nom" type="text" required value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Anna García" />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="contact-email">El teu correu</label>
                  <input id="contact-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="anna@exemple.cat" />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="contact-missatge">Missatge</label>
                  <textarea
                    id="contact-missatge" required value={missatge} onChange={e => setMissatge(e.target.value)}
                    rows={4} placeholder={`Voldria informació sobre ${activitatNom}...`}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                  />
                </div>

                {/* Honeypot field (hidden from humans, filled by bots) */}
                <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', border: 0 }} aria-hidden="true">
                  <label htmlFor="contact-website">Si us plau, no omplis aquest camp</label>
                  <input
                    id="contact-website"
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {status === 'error' && (
                  <p role="alert" style={{ color: '#c0392b', fontSize: '13px', background: '#fde8e8', padding: '10px 14px', borderRadius: '4px' }}>
                    Hi ha hagut un error enviant el missatge. Prova-ho de nou o contacta directament a {centreEmail}.
                  </p>
                )}

                <button
                  type="submit" disabled={status === 'sending'}
                  style={{
                    padding: '14px', background: status === 'sending' ? 'var(--muted)' : 'var(--verd-fosc)',
                    color: 'white', border: 'none', borderRadius: '4px', cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', transition: 'background 0.2s',
                  }}
                >
                  {status === 'sending' ? 'Enviant...' : 'Envia el missatge'}
                </button>

                <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
                  Enviat a través de gironaxics.cat · El centre rebrà el missatge i et respondrà directament
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
