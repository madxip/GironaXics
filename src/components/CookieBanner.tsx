"use client";

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem('gironaxics-analytics-consent');
    if (stored === null) {
      // Delay slightly for premium aesthetic and feel
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gironaxics-analytics-consent', 'true');
    setShow(false);
    // Notify the analytics tracker component instantly without requiring reload
    window.dispatchEvent(new CustomEvent('gironaxics-consent-changed', { detail: 'true' }));
  };

  const handleReject = () => {
    localStorage.setItem('gironaxics-analytics-consent', 'false');
    setShow(false);
    window.dispatchEvent(new CustomEvent('gironaxics-consent-changed', { detail: 'false' }));
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        maxWidth: '540px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid var(--crema-fosca)',
        boxShadow: '0 12px 40px rgba(26, 26, 24, 0.15)',
        padding: '24px',
        borderRadius: '8px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'var(--font-sans)',
        animation: 'slideUpCookie 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="status"
      aria-live="polite"
    >
      <div>
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: 'var(--verd-fosc)', fontWeight: 700 }}>
          El respecte a la teva privacitat
        </p>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--muted)' }}>
          GironaXics utilitza cookies de tercers (Google Analytics) amb finalitats exclusivament analítiques, per mesurar i avaluar de forma anònima el trànsit i el rendiment del nostre portal. Pots triar si acceptes o rebutges aquest seguiment. Trobaràs tots els detalls a la nostra <a href="/privacitat" style={{ color: 'var(--verd-fosc)', fontWeight: 700, textDecoration: 'underline' }}>Política de Privacitat</a>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleReject}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: 'var(--muted)',
            border: '1px solid var(--crema-fosca)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            transition: 'background 0.2s',
            fontFamily: 'var(--font-sans)',
          }}
          className="hoverable"
        >
          Rebutja
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--verd-fosc)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            transition: 'background 0.2s, opacity 0.2s',
            fontFamily: 'var(--font-sans)',
          }}
          className="hoverable"
        >
          Accepta
        </button>
      </div>
      <style>{`
        @keyframes slideUpCookie {
          from { transform: translateY(80px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
