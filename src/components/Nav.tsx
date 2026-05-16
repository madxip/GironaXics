"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'active' : ''}`} id="mobile-menu">
        <div className="mobile-menu-close hoverable" onClick={() => setMenuOpen(false)}>✕</div>
        <Link href="/barris/tots" className="hoverable" onClick={() => setMenuOpen(false)}>Activitats</Link>
        <Link href="/barris/tots" className="hoverable" onClick={() => setMenuOpen(false)}>Barris</Link>
        <Link href="#" className="hoverable" onClick={() => setMenuOpen(false)}>Centres</Link>
      </div>

      {/* Nav */}
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <Link href="/" className="logo hoverable" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span>Girona</span><span>Xics</span>
        </Link>
        <div className="nav-right">
            <Link href="#" className="hoverable" style={{ textDecoration: 'none' }}>Per als centres</Link>
            <Link href="/cerca" aria-label="Cerca" className="hoverable" style={{ color: 'var(--verd)', display: 'inline-flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </Link>
        </div>
        <div className="hamburger hoverable" onClick={() => setMenuOpen(true)}>☰</div>
      </nav>
    </>
  );
}
