-- ==============================================================================
-- SCHEMA SUPABASE / POSTGRESQL PER A CATALUNYAXICS (GironaXics, BcnXics, etc.)
-- Conté les 9 taules de la base de dades amb relacions de Foreign Key
-- ==============================================================================

-- 1. TAULA DE CENTRES
CREATE TABLE IF NOT EXISTS public.centres (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  adreca TEXT DEFAULT '',
  telefon TEXT DEFAULT '',
  email TEXT DEFAULT '',
  web TEXT DEFAULT '',
  barri TEXT DEFAULT '',
  descripcio TEXT DEFAULT '',
  imatge_url TEXT DEFAULT '',
  interessat BOOLEAN DEFAULT false,
  vacances TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA D'ACTIVITATS
CREATE TABLE IF NOT EXISTS public.activitats (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  centre TEXT DEFAULT '',
  centre_id TEXT REFERENCES public.centres(id) ON DELETE SET NULL,
  barri TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  categories TEXT[] DEFAULT '{}',
  edat TEXT DEFAULT '',
  preu TEXT DEFAULT '',
  destacada BOOLEAN DEFAULT false,
  centre_interessat BOOLEAN DEFAULT false,
  destacada_gran BOOLEAN DEFAULT false,
  horari TEXT DEFAULT '',
  dies TEXT DEFAULT '',
  descripcio TEXT DEFAULT '',
  durada TEXT DEFAULT '',
  alumnes TEXT DEFAULT '',
  material TEXT DEFAULT '',
  inici TEXT DEFAULT '',
  idioma TEXT DEFAULT '',
  qui_imparteix TEXT DEFAULT '',
  publicada BOOLEAN DEFAULT true,
  imatge_url TEXT DEFAULT '',
  imatge_thumbnail_url TEXT DEFAULT '',
  galeria TEXT[] DEFAULT '{}',
  centre_imatge_url TEXT DEFAULT '',
  subcategoria TEXT DEFAULT '',
  tipus TEXT DEFAULT 'Extraescolar',
  torns TEXT DEFAULT '',
  centre_vacances TEXT DEFAULT '',
  poblacio_propia TEXT DEFAULT '',
  adreca_propia TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAULA DE CATEGORIES (NOVA)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  nom TEXT UNIQUE NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  icona TEXT DEFAULT '',
  ordre INT DEFAULT 0,
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TAULA DE SUBCATEGORIES
CREATE TABLE IF NOT EXISTS public.subcategories (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categoria TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TAULA DE SPONSORS
CREATE TABLE IF NOT EXISTS public.sponsors (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categoria_slug TEXT NOT NULL DEFAULT '',
  imatge_url TEXT DEFAULT '',
  enllac TEXT DEFAULT '',
  actiu BOOLEAN DEFAULT true,
  descripcio TEXT DEFAULT '',
  imatge_fons_url TEXT DEFAULT '',
  titol TEXT DEFAULT '',
  posicio_fons TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TAULA DE BANNER DE CASALS / SECCIONS
CREATE TABLE IF NOT EXISTS public.casals_banners (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  actiu BOOLEAN DEFAULT true,
  kicker TEXT DEFAULT '',
  titol TEXT DEFAULT '',
  subtitol TEXT DEFAULT '',
  dates TEXT DEFAULT '',
  data_limit TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAULA DE POBLACIONS
CREATE TABLE IF NOT EXISTS public.poblacions (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  comarca TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TAULA D'USUARIS CENTRES (Portal de gestió pels centres)
CREATE TABLE IF NOT EXISTS public.usuaris_centres (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  centre_id TEXT REFERENCES public.centres(id) ON DELETE SET NULL,
  password_hash TEXT DEFAULT '',
  ciutat TEXT NOT NULL DEFAULT 'girona',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TAULA D'ANALYTICS (NOVA - Mètrics i estadístiques)
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

-- ==============================================================================
-- ÍNDEXS DE RENDIMENT (Performance Indexes)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_activitats_slug ON public.activitats(slug);
CREATE INDEX IF NOT EXISTS idx_activitats_ciutat ON public.activitats(ciutat);
CREATE INDEX IF NOT EXISTS idx_activitats_publicada ON public.activitats(publicada);
CREATE INDEX IF NOT EXISTS idx_activitats_categoria ON public.activitats(categoria);
CREATE INDEX IF NOT EXISTS idx_activitats_barri ON public.activitats(barri);
CREATE INDEX IF NOT EXISTS idx_activitats_tipus ON public.activitats(tipus);

CREATE INDEX IF NOT EXISTS idx_centres_slug ON public.centres(slug);
CREATE INDEX IF NOT EXISTS idx_centres_ciutat ON public.centres(ciutat);

CREATE INDEX IF NOT EXISTS idx_sponsors_actiu ON public.sponsors(actiu, ciutat);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at);

-- ==============================================================================
-- POLÍTIQUES DE SEGURETAT (Row Level Security - RLS)
-- Permet la lectura pública de tots els registres des de la web
-- ==============================================================================
ALTER TABLE public.activitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casals_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poblacions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuaris_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Lectura pública (Anon & Authenticated)
CREATE POLICY "Lectura pública activitats" ON public.activitats FOR SELECT USING (true);
CREATE POLICY "Lectura pública centres" ON public.centres FOR SELECT USING (true);
CREATE POLICY "Lectura pública categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Lectura pública subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Lectura pública sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Lectura pública casals_banners" ON public.casals_banners FOR SELECT USING (true);
CREATE POLICY "Lectura pública poblacions" ON public.poblacions FOR SELECT USING (true);

-- Permetre inserció pública d'analytics
CREATE POLICY "Inserció pública d'analytics" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública d'analytics" ON public.analytics FOR SELECT USING (true);
