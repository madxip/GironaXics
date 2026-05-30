'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary GironaXics]:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--crema)',
      color: 'var(--fosc)',
      fontFamily: 'var(--font-sans)',
      textAlign: 'center'
    }}>
      <div className="texture" style={{ pointerEvents: 'none', mixBlendMode: 'multiply' }}></div>
      <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 10 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '48px',
          color: 'var(--verd-fosc)',
          margin: 0
        }}>
          Vaja, alguna cosa no ha anat bé
        </h1>
        
        <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
          Sembla que hi ha hagut una petita incidència en connectar amb el servidor o obtenir les dades d&apos;Airtable.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
          <button
            onClick={() => reset()}
            className="hoverable"
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--verd)',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--verd-fosc)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--verd)'}
          >
            Torna-ho a provar
          </button>
          
          <Link
            href="/"
            className="hoverable"
            style={{
              padding: '12px 28px',
              backgroundColor: 'transparent',
              color: 'var(--verd-fosc)',
              border: '2px solid var(--verd-fosc)',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--verd-fosc)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--verd-fosc)';
            }}
          >
            Inici
          </Link>
        </div>
      </div>
    </div>
  );
}
