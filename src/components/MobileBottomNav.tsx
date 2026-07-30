"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToFiltres = () => {
    const el = document.getElementById('filtres');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!mounted) return null;

  return (
    <nav className="mobile-bottom-nav">
      <button 
        type="button" 
        onClick={scrollToFiltres}
        className={`mobile-bottom-nav-item ${pathname === '/' ? 'active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>EXPLORA</span>
      </button>

      <button 
        type="button" 
        onClick={() => {
          scrollToFiltres();
        }}
        className="mobile-bottom-nav-item"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>CALENDARI</span>
      </button>

      <Link href="/cerca" className={`mobile-bottom-nav-item ${pathname === '/cerca' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>DESATS</span>
      </Link>

      <Link href="/login" className={`mobile-bottom-nav-item ${pathname?.startsWith('/dashboard') || pathname === '/login' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>PERFIL</span>
      </Link>

      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background-color: #f7f5ef;
          border-top: 1px solid var(--crema-fosca, #eae2d1);
          z-index: 999;
          padding: 6px 12px;
          justify-content: space-around;
          align-items: center;
          box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex;
          }
        }

        .mobile-bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          color: #718096;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-decoration: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .mobile-bottom-nav-item.active {
          color: var(--verd, #1b3d2f);
          background-color: rgba(27, 61, 47, 0.08);
        }

        .mobile-bottom-nav-item .nav-icon {
          width: 20px;
          height: 20px;
        }
      `}</style>
    </nav>
  );
}
