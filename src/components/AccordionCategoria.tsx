"use client";

import { useState, useEffect } from 'react';
import { Activitat } from '@/lib/types';
import ActivitatCard from './ActivitatCard';

// Nombre de targetes visibles per defecte per acordió
const PAGE_SIZE = 24;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Quan canvien els filtres (activitats) reinicia la paginació al principi
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activitats]);

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

  const isGridGroup = activitats.some(a => 
    a.tipus?.toLowerCase().includes('casal') || 
    a.tipus?.toLowerCase().includes('taller') || 
    a.tipus?.toLowerCase().includes('oci')
  );

  const visible   = activitats.slice(0, visibleCount);
  const remaining = activitats.length - visibleCount;

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
      
      {/* Renderització condicional: el contingut NOMÉS existeix al DOM quan l'acordió
          és obert. Anteriorment s'usava display:none i totes les ~400 targetes eren
          presents a l'HTML inicial (↑ 658 KiB). Ara l'HTML inicial és buit fins que
          l'usuari clica, reduint el pes inicial dràsticament. */}
      {isOpen && (
        <div 
          id={`accordion-content-${categoria.replace(/\s+/g, '-')}`} 
          className={isGridGroup ? `casals-responsive-grid ${hasSponsor ? 'single-column' : 'two-columns'}` : 'accordion-content'} 
          style={{ 
            padding: '16px 0',
            display: isGridGroup ? 'grid' : 'flex',
            flexDirection: isGridGroup ? undefined : 'column', 
            gap: isGridGroup ? undefined : '16px',
          }}
        >
          {visible.map(a => (
            <ActivitatCard key={a.slug} activitat={a} />
          ))}

          {/* Paginació: "Veure'n X més" si hi ha més targetes del PAGE_SIZE */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              style={{
                gridColumn: isGridGroup ? '1 / -1' : undefined,
                marginTop: '16px',
                padding: '12px 32px',
                background: 'none',
                border: '2px solid var(--verd)',
                borderRadius: '24px',
                color: 'var(--verd-fosc)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                alignSelf: 'center',
              }}
            >
              Veure&apos;n {Math.min(remaining, PAGE_SIZE)} més
            </button>
          )}
        </div>
      )}
    </div>
  );
}
