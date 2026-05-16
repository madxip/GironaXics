"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/cerca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="hero">
        <h1 className="hero-title">
            <div className="line-1">Troba</div>
            <div className="line-2">les millors</div>
            <div className="line-3">extraescolars.</div>
        </h1>
        <form className="hero-search" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Quina activitat busques?" 
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="arrow hoverable" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>→</button>
        </form>
        <div className="hero-subtitle">De Girona. Per a Girona.<br />En català.</div>
        <div className="scroll-indicator">Fes scroll per descobrir</div>
    </section>
  );
}
