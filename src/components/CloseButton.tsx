'use client';

import { useRouter } from 'next/navigation';

export default function CloseButton() {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/#filtres');
    }
  };

  return (
    <button 
      type="button"
      onClick={handleClose} 
      className="modal-close hoverable" 
      aria-label="Tancar la fitxa d'activitat"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '1.5px solid rgba(27, 61, 47, 0.18)',
        color: 'var(--verd-fosc, #0c2214)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 700,
        zIndex: 99999,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, background-color 0.2s ease',
      }}
    >
      ✕
    </button>
  );
}
