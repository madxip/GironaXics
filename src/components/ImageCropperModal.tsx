'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
  aspectRatio?: number; // p.ex. 16/9 o 4/3
}

export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 16 / 9
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset offset on image change
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    if (!imgRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Amplitud de sortida HD per a la imatge de fons
    const targetWidth = 1200;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const container = containerRef.current.getBoundingClientRect();
    const img = imgRef.current;

    // Calcular escala i posició relativa de la imatge dins del Marc de Retall
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    // Escala del contenidor visual respecte al canvas de sortida
    const scaleFactor = targetWidth / container.width;

    // Renderitzar imatge al canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    // Traslladar i escalar segons el zoom i l'arrossegament de l'usuari
    ctx.translate(
      targetWidth / 2 + offset.x * scaleFactor,
      targetHeight / 2 + offset.y * scaleFactor
    );
    ctx.scale(zoom, zoom);

    // Dibuixar la imatge centrada
    const drawWidth = container.width * scaleFactor;
    const drawHeight = (container.width / (imgNaturalWidth / imgNaturalHeight)) * scaleFactor;

    ctx.drawImage(
      img,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Capçalera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>🖼️ Retallar Imatge de Fons</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              Arrossega la imatge i utilitza el zoom per enquadrar el fons del patrocinador.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Àrea de Retall / Canvas d'Enquadrament */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '300px',
            backgroundColor: '#111827',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #4b5563'
          }}
        >
          {/* Imatge arrossegable */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Per retallar"
            style={{
              position: 'absolute',
              maxWidth: 'none',
              width: '100%',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              userSelect: 'none',
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          />

          {/* Marc de Guia / Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid var(--verd, #10b981)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            borderRadius: '8px'
          }} />
        </div>

        {/* Controls de Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#374151', padding: '12px 16px', borderRadius: '10px' }}>
          <ZoomOut size={18} color="#9ca3af" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--verd, #10b981)', cursor: 'pointer' }}
          />
          <ZoomIn size={18} color="#9ca3af" />
          <span style={{ fontSize: '13px', fontWeight: 600, width: '45px', textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Botons d'Acció */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              background: 'transparent',
              color: '#d1d5db',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel·la
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--verd, #10b981)',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={18} /> Retalla i Desa
          </button>
        </div>
      </div>
    </div>
  );
}
