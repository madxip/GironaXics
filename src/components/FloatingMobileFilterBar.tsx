"use client";

import { useEffect, useState } from 'react';

export default function FloatingMobileFilterBar() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Només es mostra quan l'usuari fa scroll a més de 250px
      if (window.scrollY > 250) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  const scrollToFiltres = () => {
    const el = document.getElementById('filtres');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!visible) return null;

  return (
    <div className="mobile-floating-filter-container">
      <button 
        type="button" 
        onClick={scrollToFiltres} 
        className="mobile-floating-filter-btn"
        aria-label="Cercar i filtrar activitats"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em' }}>
          Cercar & Filtres
        </span>
      </button>

      <style jsx>{`
        .mobile-floating-filter-container {
          display: none;
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 998;
          animation: floatIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 768px) {
          .mobile-floating-filter-container {
            display: block;
          }
        }

        .mobile-floating-filter-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 22px;
          background-color: var(--verd, #1b3d2f);
          color: #ffffff;
          border: none;
          border-radius: 40px;
          box-shadow: 0 8px 24px rgba(27, 61, 47, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .mobile-floating-filter-btn:active {
          transform: scale(0.96);
          background-color: #122b21;
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
