"use client";

import { useEffect, useRef } from 'react';

export default function Stats({ 
  numCentres = 60, 
  numCategories = 10,
  numActivitats = 200 
}: { 
  numCentres?: number;
  numCategories?: number;
  numActivitats?: number;
}) {
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerStats = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const val = parseInt(el.getAttribute('data-val') || '0', 10);
          const isPlus = el.innerText.includes('+');
          const duration = 1500;
          const startTime = performance.now();

          const update = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutQuart
            const ease = 1 - Math.pow(1 - progress, 4);
            el.innerText = Math.floor(ease * val) + (isPlus ? '+' : '');
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              el.innerText = val + (isPlus ? '+' : '');
            }
          }
          requestAnimationFrame(update);
          observerStats.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statRefs.current.forEach(stat => {
      if (stat) observerStats.observe(stat);
    });

    return () => observerStats.disconnect();
  }, []);

  return (
    <section className="stats">
        <div className="grid-12">
            <div className="stat-item">
                <div className="stat-number stat-anim" data-val={numCentres} ref={el => { statRefs.current[0] = el; }}>0</div>
                <div className="stat-label">centres adherits</div>
            </div>
            <div className="stat-item">
                <div className="stat-number stat-anim" data-val={numCategories} ref={el => { statRefs.current[1] = el; }}>0</div>
                <div className="stat-label">categories<br/>d&apos;activitats</div>
            </div>
            <div className="stat-item">
                <div className="stat-number stat-anim" data-val={numActivitats} ref={el => { statRefs.current[2] = el; }}>+0</div>
                <div className="stat-label">activitats disponibles</div>
            </div>
        </div>
    </section>
  );
}
