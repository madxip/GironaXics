"use client";

import { useState } from 'react';
import { Activitat } from '@/lib/types';
import ActivitatCard from './ActivitatCard';

export default function AccordionCategoria({ categoria, activitats }: { categoria: string, activitats: Activitat[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="result-item" style={{ marginBottom: '16px' }}>
      <div 
        className="result-title hoverable" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '8px'
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
      </div>
      
      {isOpen && (
        <div className="accordion-content" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activitats.map(a => (
            <ActivitatCard key={a.slug} activitat={a} />
          ))}
        </div>
      )}
    </div>
  );
}
