"use client";

import { useState, useEffect } from 'react';

export default function Galeria({ images }: { images?: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Afegim suport per tecles (fletxes) per navegar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null || !images) return;
      if (e.key === 'ArrowRight') {
        setSelectedIndex((selectedIndex + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images]);

  if (!images || images.length === 0) return null;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--verd-fosc)' }}>
        Galeria d'imatges
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
        {images.map((url, idx) => (
          <div 
            key={idx} 
            className="hoverable"
            onClick={() => setSelectedIndex(idx)}
            style={{ 
              aspectRatio: '1', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              cursor: 'pointer',
              border: '1px solid var(--crema-fosca)'
            }}
          >
            <img 
              src={url} 
              alt={`Galeria imatge ${idx + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {images.length > 1 && (
            <button 
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '40px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                zIndex: 10000,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              &#10094;
            </button>
          )}

          <img 
            src={images[selectedIndex]} 
            alt="Imatge ampliada" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }} 
          />

          {images.length > 1 && (
            <button 
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '40px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '10px 20px',
                borderRadius: '8px',
                zIndex: 10000,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              &#10095;
            </button>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '40px',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 10000
            }}
          >
            &times;
          </button>
          
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              opacity: 0.8
            }}>
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
