"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { Activitat } from '@/lib/types';
import { normalizeSlug } from '@/lib/airtable';

import { 
  Palette, 
  Sparkles, 
  ChefHat, 
  Footprints, 
  Castle, 
  Trophy, 
  Languages, 
  Flower2, 
  Music, 
  Leaf, 
  Bot, 
  Theater, 
  BookOpen,
  Star
} from 'lucide-react';

const getIconForCategory = (cat: string) => {
  const norm = cat.toLowerCase();
  const props = { size: 48, strokeWidth: 1.5, stroke: 'currentColor' };
  
  if (norm.includes('art') || norm.includes('plàstiques')) return <Palette {...props} />;
  if (norm.includes('creativitat') || norm.includes('expressió')) return <Sparkles {...props} />;
  if (norm.includes('cuina')) return <ChefHat {...props} />;
  if (norm.includes('dansa')) return <Footprints {...props} />;
  if (norm.includes('escacs')) return <Castle {...props} />;
  if (norm.includes('esport')) return <Trophy {...props} />;
  if (norm.includes('idiome') || norm.includes('anglès')) return <Languages {...props} />;
  if (norm.includes('ioga')) return <Flower2 {...props} />;
  if (norm.includes('música')) return <Music {...props} />;
  if (norm.includes('natura')) return <Leaf {...props} />;
  if (norm.includes('robòtica') || norm.includes('tecnologia')) return <Bot {...props} />;
  if (norm.includes('teatre') || norm.includes('arts escèniques')) return <Theater {...props} />;
  if (norm.includes('educació') || norm.includes('reforç')) return <BookOpen {...props} />;
  
  return <Star {...props} />;
};

export default function Categories({ activitats = [] }: { activitats?: Activitat[] }) {
  const uniqueCats = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.categoria) set.add(a.categoria); });
    return Array.from(set).sort();
  }, [activitats]);

  return (
    <section className="categories" style={{ padding: '0 5vw 80px' }}>
        <div className="cat-grid">
            {uniqueCats.map(cat => (
                <Link key={cat} href={`/categories/${normalizeSlug(cat)}`} className="cat-item hoverable" style={{textDecoration:'none', color:'inherit'}}>
                    <div className="cat-icon">
                        {getIconForCategory(cat)}
                    </div>
                    <div className="cat-name">{cat}</div>
                </Link>
            ))}
        </div>
    </section>
  );
}
