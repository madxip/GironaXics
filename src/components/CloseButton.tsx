'use client';

import { useRouter } from 'next/navigation';

export default function CloseButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="modal-close hoverable" 
      style={{ position: 'fixed', top: '24px', right: '5vw', zIndex: 20010, cursor: 'pointer' }}
    >
      ✕
    </button>
  );
}
