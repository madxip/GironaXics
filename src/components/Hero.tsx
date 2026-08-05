"use client";

import { useEffect, useRef } from 'react';

interface HeroProps {
  numCentres?: number;
  numCategories?: number;
  numActivitats?: number;
}

export default function Hero({
  numCentres = 73,
  numCategories = 11,
  numActivitats = 450
}: HeroProps) {
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const val = parseInt(el.getAttribute('data-val') || '0', 10);
          const isPlus = el.getAttribute('data-plus') === 'true';
          const duration = 1200;
          const startTime = performance.now();

          const update = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(ease * val);
            el.innerText = isPlus ? `+${currentVal}` : `${currentVal}`;
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              el.innerText = isPlus ? `+${val}` : `${val}`;
            }
          };
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    statRefs.current.forEach(stat => {
      if (stat) observer.observe(stat);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-wrapper">
      <section className="hero">
        <h1 className="hero-title">
          <div className="line-1">Troba</div>

          {/* Contenidor de les paraules amb slider vertical en CSS pur */}
          <div className="words-container">
            <div className="words-slider">
              <div className="word-slide">
                <div className="line-2">les millors</div>
                <div className="line-3">extraescolars</div>
              </div>
              <div className="word-slide">
                <div className="line-2">els millors</div>
                <div className="line-3">tallers</div>
              </div>
              <div className="word-slide">
                <div className="line-2">les millors</div>
                <div className="line-3">activitats</div>
              </div>
              <div className="word-slide">
                <div className="line-2">els millors</div>
                <div className="line-3">casals</div>
              </div>
              {/* Repetició de la primera per a un loop infinit i fluid */}
              <div className="word-slide">
                <div className="line-2">les millors</div>
                <div className="line-3">extraescolars</div>
              </div>
            </div>
          </div>
        </h1>
      </section>

      {/* Franja verda de costat a costat (Full Width Green Strip) */}
      <div className="hero-green-stats-bar">
        <div className="hero-green-stats-container">
          <div className="hero-stat-box">
            <div className="hero-stat-number" data-val={numCentres} ref={el => { statRefs.current[0] = el; }}>{numCentres}</div>
            <div className="hero-stat-label">centres</div>
          </div>
          <div className="hero-stat-box">
            <div className="hero-stat-number" data-val={numCategories} ref={el => { statRefs.current[1] = el; }}>{numCategories}</div>
            <div className="hero-stat-label">categories</div>
          </div>
          <div className="hero-stat-box">
            <div className="hero-stat-number" data-val={numActivitats} data-plus="true" ref={el => { statRefs.current[2] = el; }}>+{numActivitats}</div>
            <div className="hero-stat-label">activitats</div>
          </div>
        </div>
      </div>    </div>
  );
}
