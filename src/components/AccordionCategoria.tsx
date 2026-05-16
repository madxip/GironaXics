"use client";

import { useState } from 'react';
import { Activitat } from '@/lib/types';
import ActivitatCard from './ActivitatCard';

export default function AccordionCategoria({ categoria, activitats, defaultOpen = false }: { categoria: string, activitats: Activitat[], defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="result-item" style={{ marginBottom: '16px' }}>
      <button 
        type="button"
        className="hoverable" 
        onClick={() => setIsOpen(!isOpen)}
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
      
      {isOpen && (
        <div id={`accordion-content-${categoria.replace(/\s+/g, '-')}`} className="accordion-content" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activitats.map(a => (
            <ActivitatCard key={a.slug} activitat={a} />
          ))}
        </div>
      )}
    </div>
  );
}
