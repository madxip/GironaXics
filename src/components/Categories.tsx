"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/utils';

export default function Categories({ activitats = [] }: { activitats?: Activitat[] }) {
  const uniqueCats = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.categoria) set.add(a.categoria); });
    return Array.from(set).sort();
  }, [activitats]);

  return (
    <section className="categories">
      <div className="cat-header">
        <span className="cat-header-num">{String(uniqueCats.length).padStart(2, '0')}</span>
        <div className="cat-header-meta">
          <span className="cat-header-title">Categories actives</span>
        </div>
      </div>

      <div className="cat-grid">
        {uniqueCats.map((cat, index) => {
          const formattedIndex = String(index + 1).padStart(2, '0');
          return (
            <Link
              key={cat}
              href={`/categories/${normalizeSlug(cat)}`}
              className="cat-item"
              style={{ textDecoration: 'none' }}
            >
              <span className="cat-number">{formattedIndex}</span>
              <span className="cat-name">{cat}</span>
              <span className="cat-arrow">→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
