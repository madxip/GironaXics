"use client";

import { useState, useEffect } from 'react';
import { Activitat } from '@/lib/types';
import ActivitatCard from './ActivitatCard';

export default function AccordionCategoria({ 
  categoria, 
  activitats, 
  forceOpen = false,
  hasSponsor = false
}: { 
  categoria: string, 
  activitats: Activitat[], 
  forceOpen?: boolean,
  hasSponsor?: boolean
}) {
  // Per defecte sempre tancat. forceOpen s'usa quan hi ha una única categoria
  // filtrada (el cas "categoria seleccionada") i obre directament sense consultar
  // la sessionStorage.
  const [isOpen, setIsOpen] = useState(forceOpen);

  useEffect(() => {
    if (forceOpen) {
      // Categoria única filtrada → sempre obre
      setIsOpen(true);
      return;
    }
    // Vista multi-categoria: llegim el darrer estat manual de l'usuari
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`accordion-open-${categoria}`);
      // Si no hi ha res emmagatzemat: per defecte tancat
      setIsOpen(stored === 'true');
    }
  }, [categoria, forceOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`accordion-open-${categoria}`, String(nextState));
    }
  };

  return (
    <div className="result-item" style={{ marginBottom: '16px' }}>
      <button 
        type="button"
        className="hoverable" 
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${categoria.replace(/\s+/g, '-')}`}
        style={{ 
          fontFamily: 'var(--font-sans)',
          fontSize: '18px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--verd-fosc)',
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '8px',
          background: 'none',
          border: 'none',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <span>{categoria}</span>
        <span style={{ 
          fontSize: '14px', 
          color: 'var(--verd)',
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.3s' 
        }}>
          ▼
        </span>
      </button>
      
      {(() => {
        const isGridGroup = activitats.some(a => 
          a.tipus?.toLowerCase().includes('casal') || 
          a.tipus?.toLowerCase().includes('taller') || 
          a.tipus?.toLowerCase().includes('oci')
        );
        return (
          <div 
            id={`accordion-content-${categoria.replace(/\s+/g, '-')}`} 
            className={isGridGroup ? `casals-responsive-grid ${hasSponsor ? 'single-column' : 'two-columns'}` : 'accordion-content'} 
            style={{ 
              padding: isOpen ? '16px 0' : '0', 
              display: isOpen ? (isGridGroup ? 'grid' : 'flex') : 'none', 
              flexDirection: isGridGroup ? undefined : 'column', 
              gap: isGridGroup ? undefined : '16px' 
            }}
          >
            {activitats.map((a, idx) => (
              <ActivitatCard key={`${a.id || a.slug}-${idx}`} activitat={a} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
