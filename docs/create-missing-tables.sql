-- ==============================================================================
-- CREAR LES 2 TAULES MANCANTS A SUPABASE (categories i analytics)
-- Executa aquestes línies a l'SQL Editor de Supabase (https://supabase.com)
-- ==============================================================================

-- 1. TAULA DE CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  icona TEXT DEFAULT '',
  ordre INT DEFAULT 0,
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA D'ANALYTICS
CREATE TABLE IF NOT EXISTS public.analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type TEXT NOT NULL,
  event_label TEXT DEFAULT '',
  category_name TEXT DEFAULT '',
  device TEXT DEFAULT '',
  centre_id TEXT REFERENCES public.centres(id) ON DELETE SET NULL,
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR SEGURETAT RLS I LECTURA/ESCRIPTURA
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública categories" ON public.categories;
CREATE POLICY "Lectura pública categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserció pública d'analytics" ON public.analytics;
CREATE POLICY "Inserció pública d'analytics" ON public.analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública d'analytics" ON public.analytics;
CREATE POLICY "Lectura pública d'analytics" ON public.analytics FOR SELECT USING (true);
