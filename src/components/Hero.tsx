"use client";

import { useState, useEffect } from 'react';

const WORDS = [
  { article: 'les', word: 'extraescolars' },
  { article: 'els', word: 'tallers' },
  { article: 'les', word: 'activitats' },
  { article: 'els', word: 'casals' },
];

// Duration each word is visible (ms)
const DISPLAY_MS = 2600;
// Duration of the exit + enter animation (ms each)
const ANIM_MS = 380;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'visible' | 'exit' | 'enter'>('visible');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'visible') {
      // Wait, then start exit animation
      timeout = setTimeout(() => setPhase('exit'), DISPLAY_MS);
    } else if (phase === 'exit') {
      // After exit animation, advance index and start enter animation
      timeout = setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length);
        setPhase('enter');
      }, ANIM_MS);
    } else {
      // After enter animation, go back to visible
      timeout = setTimeout(() => setPhase('visible'), ANIM_MS);
    }

    return () => clearTimeout(timeout);
  }, [phase]);

  const current = WORDS[index];

  const animStyle = (phase: 'visible' | 'exit' | 'enter'): React.CSSProperties => {
    if (phase === 'exit') return {
      transform: 'translateY(-100%)',
      opacity: 0,
      transition: `transform ${ANIM_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ANIM_MS}ms ease`,
    };
    if (phase === 'enter') return {
      transform: 'translateY(20%)',
      opacity: 0,
      transition: 'none',
    };
    // visible
    return {
      transform: 'translateY(0)',
      opacity: 1,
      transition: `transform ${ANIM_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${ANIM_MS}ms ease`,
    };
  };

  return (
    <section className="hero">
      <h1 className="hero-title">
        <div className="line-1">Troba</div>

        {/* "les" / "els" — animat */}
        <div className="line-2" style={{ overflow: 'hidden' }}>
          <span style={{ display: 'inline-block', ...animStyle(phase) }}>
            {current.article} millors
          </span>
        </div>

        {/* paraula animada */}
        <div className="line-3" style={{ overflow: 'hidden' }}>
          <span style={{ display: 'inline-block', ...animStyle(phase) }}>
            {current.word}
          </span>
        </div>
      </h1>
      <div className="scroll-indicator">Fes scroll per descobrir</div>
    </section>
  );
}
