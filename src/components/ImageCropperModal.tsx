'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Crop } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
  aspectRatio?: number; // p.ex. 3/4 o 16/9
}

export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 3 / 4
}: ImageCropperModalProps) {
  const [currentAspect, setCurrentAspect] = useState<number>(aspectRatio);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }, [imageSrc, currentAspect]);

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

    // Resolució HD de sortida
    const targetWidth = currentAspect < 1 ? 900 : 1200;
    const targetHeight = Math.round(targetWidth / currentAspect);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const container = containerRef.current.getBoundingClientRect();
    const img = imgRef.current;

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    const scaleFactor = targetWidth / container.width;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.save();
    ctx.translate(
      targetWidth / 2 + offset.x * scaleFactor,
      targetHeight / 2 + offset.y * scaleFactor
    );
    ctx.scale(zoom, zoom);

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
      backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
        maxWidth: '540px',
        padding: '20px 24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '95vh',
        overflowY: 'auto'
      }}>
        {/* Capçalera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>🖼️ Retallar Imatge de Fons</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Arrossega i ajusta el zoom per enquadrar el fons del patrocinador.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Proporció fixada segons tipus de dispositiu */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#374151', padding: '8px 12px', borderRadius: '8px' }}>
          <Crop size={15} color="#10b981" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
            Proporció fixada: {Math.abs(aspectRatio - 1) < 0.01 ? '📱 1:1 Quadrat (Mòbil)' : '🖥️ 3:4 Vertical (Desktop)'}
          </span>
        </div>

        {/* Àrea de Retall */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              position: 'relative',
              width: Math.abs(currentAspect - 1) < 0.01 ? '260px' : currentAspect < 1 ? '240px' : '100%',
              height: Math.abs(currentAspect - 1) < 0.01 ? '260px' : currentAspect < 1 ? '320px' : '260px',
              backgroundColor: '#111827',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #4b5563',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
            }}
          >
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

            <div style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid var(--verd, #10b981)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              borderRadius: '8px'
            }} />
          </div>
        </div>

        {/* Controls de Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#374151', padding: '10px 16px', borderRadius: '10px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              background: 'transparent',
              color: '#d1d5db',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel·la
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--verd, #10b981)',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={16} /> Retalla i Desa
          </button>
        </div>
      </div>
    </div>
  );
}
