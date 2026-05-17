"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/cerca?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    } else {
      router.push('/cerca');
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobile-menu">
        <div className="mobile-menu-close hoverable" onClick={() => setMenuOpen(false)}>✕</div>
        <Link href="/barris/tots" className="hoverable" onClick={() => setMenuOpen(false)}>Activitats</Link>
        <Link href="/barris/tots" className="hoverable" onClick={() => setMenuOpen(false)}>Barris</Link>
        <Link href="#" className="hoverable" onClick={() => setMenuOpen(false)}>Centres</Link>
      </div>

      {/* Nav */}
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        {/* Search overlay — shown when searchOpen */}
        {searchOpen && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'var(--crema)',
              display: 'flex', alignItems: 'center',
              padding: '0 5vw', gap: '16px',
              animation: 'fadeIn 0.2s ease',
              zIndex: 10,
            }}
          >
            <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--verd)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Quina activitat busques?"
                aria-label="Cerca una activitat"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontFamily: 'var(--font-sans)', fontSize: '18px',
                  color: 'var(--fosc)', outline: 'none', padding: '10px 0',
                }}
              />
              {query && (
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--verd)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', padding: '0 8px' }}>
                  Cerca →
                </button>
              )}
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Tanca la cerca"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: 'var(--muted)', lineHeight: 1, padding: '4px' }}
            >
              ✕
            </button>
          </div>
        )}

        <Link href="/" className="logo hoverable" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span>Girona</span><span>Xics</span>
        </Link>
        <div className="nav-right">
            <Link href="#" className="hoverable" style={{ textDecoration: 'none' }}>Per als centres</Link>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Cerca"
              aria-expanded={searchOpen}
              className="hoverable"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--verd)', display: 'inline-flex', padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
        </div>
        <div className="hamburger hoverable" onClick={() => setMenuOpen(true)}>☰</div>
      </nav>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
