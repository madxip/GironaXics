/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Activitat, Centre, Sponsor, CasalsBanner, PoblacioRecord } from './types';
import { normalizeSlug } from './utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface CategoryRecord {
  id: string;
  nom: string;
  slug: string;
  icona?: string;
  ordre?: number;
}

export interface SubcategoryRecord {
  id: string;
  nom: string;
  categoria: string;
}

export interface UserRecord {
  id: string;
  email: string;
  centreId: string;
  nom?: string;
  nomCentre?: string;
  passwordHash?: string;
  aprovat?: boolean;
  isAdmin?: boolean;
}

export interface AnalyticsRecord {
  id: string;
  event_type: string;
  event_label: string;
  category_name?: string;
  device?: string;
  centre_id?: string;
  created_at: string;
}

// ─── MAPEADORS ─────────────────────────────────────────────────────────────

function mapSupabaseActivitat(r: Record<string, any>): Activitat {
  return {
    id: r.id,
    slug: r.slug,
    nom: r.nom,
    centre: r.centre || '',
    centreId: r.centre_id || undefined,
    barri: r.barri || '',
    categoria: r.categoria || '',
    categories: r.categories || [],
    edat: r.edat || '',
    preu: r.preu || '',
    destacada: !!r.destacada,
    centreInteressat: !!r.centre_interessat,
    destacada_gran: !!r.destacada_gran,
    horari: r.horari || '',
    dies: r.dies || '',
    descripcio: r.descripcio || '',
    durada: r.durada || '',
    alumnes: r.alumnes || '',
    material: r.material || '',
    inici: r.inici || '',
    idioma: r.idioma || '',
    qui_imparteix: r.qui_imparteix || '',
    publicada: !!r.publicada,
    imatgeUrl: r.imatge_url || '',
    imatgeThumbnailUrl: r.imatge_thumbnail_url || r.imatge_url || '',
    galeria: r.galeria || [],
    centreImatgeUrl: r.centre_imatge_url || '',
    subcategoria: r.subcategoria || '',
    tipus: r.tipus || 'Extraescolar',
    torns: r.torns || undefined,
    centreVacances: r.centre_vacances || undefined,
    poblacio_propia: r.poblacio_propia || '',
    adreca_propia: r.adreca_propia || '',
  };
}

function mapSupabaseCentre(r: Record<string, any>): Centre {
  return {
    id: r.id,
    slug: r.slug,
    nom: r.nom,
    adreca: r.adreca || '',
    telefon: r.telefon || '',
    email: r.email || '',
    web: r.web || '',
    barri: r.barri || '',
    descripcio: r.descripcio || '',
    imatgeUrl: r.imatge_url || '',
    interessat: !!r.interessat,
    vacances: r.vacances || '',
  };
}

// ─── 1. ACTIVITATS ─────────────────────────────────────────────────────────

export async function getDbActivitats(ciutat: string = 'girona'): Promise<Activitat[]> {
  if (!supabase) return [];
  const { data: actData, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('ciutat', ciutat)
    .eq('publicada', true);

  if (error || !actData) {
    console.error('[Supabase DB] Error obtenint activitats:', error);
    return [];
  }

  const { data: centreData } = await supabase.from('centres').select('id, imatge_url, interessat');
  const centreMap = new Map((centreData || []).map(c => [c.id, c]));

  const activitats = actData.map(r => {
    const act = mapSupabaseActivitat(r);
    if (r.centre_id && centreMap.has(r.centre_id)) {
      const c = centreMap.get(r.centre_id)!;
      act.centreImatgeUrl = c.imatge_url || act.centreImatgeUrl || '';
      act.centreInteressat = !!(c.interessat || act.centreInteressat);
    }
    return act;
  });

  return activitats.sort((a, b) => {
    if (a.centreInteressat && !b.centreInteressat) return -1;
    if (!a.centreInteressat && b.centreInteressat) return 1;
    return a.nom.localeCompare(b.nom, 'ca');
  });
}

export async function getAllDbActivitats(ciutat: string = 'girona'): Promise<Activitat[]> {
  if (!supabase) return [];
  const { data: actData, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('ciutat', ciutat);

  if (error || !actData) {
    console.error('[Supabase DB] Error obtenint totes les activitats:', error);
    return [];
  }

  const { data: centreData } = await supabase.from('centres').select('id, imatge_url, interessat');
  const centreMap = new Map((centreData || []).map(c => [c.id, c]));

  const activitats = actData.map(r => {
    const act = mapSupabaseActivitat(r);
    if (r.centre_id && centreMap.has(r.centre_id)) {
      const c = centreMap.get(r.centre_id)!;
      act.centreImatgeUrl = c.imatge_url || act.centreImatgeUrl || '';
      act.centreInteressat = !!(c.interessat || act.centreInteressat);
    }
    return act;
  });

  return activitats.sort((a, b) => {
    if (a.centreInteressat && !b.centreInteressat) return -1;
    if (!a.centreInteressat && b.centreInteressat) return 1;
    return a.nom.localeCompare(b.nom, 'ca');
  });
}

export async function getDbActivitatBySlug(slug: string, ciutat: string = 'girona'): Promise<Activitat | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('ciutat', ciutat)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  const act = mapSupabaseActivitat(data);
  if (data.centre_id) {
    const { data: centre } = await supabase.from('centres').select('imatge_url, interessat').eq('id', data.centre_id).single();
    if (centre) {
      act.centreImatgeUrl = centre.imatge_url || act.centreImatgeUrl || '';
      act.centreInteressat = !!(centre.interessat || act.centreInteressat);
    }
  }
  return act;
}

export async function getDbActivitatById(id: string): Promise<Activitat | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('activitats').select('*').eq('id', id).single();
  if (error || !data) return null;
  const act = mapSupabaseActivitat(data);
  if (data.centre_id) {
    const { data: centre } = await supabase.from('centres').select('imatge_url, interessat').eq('id', data.centre_id).single();
    if (centre) {
      act.centreImatgeUrl = centre.imatge_url || act.centreImatgeUrl || '';
      act.centreInteressat = !!(centre.interessat || act.centreInteressat);
    }
  }
  return act;
}

export async function createDbActivitat(data: Partial<Omit<Activitat, 'categoria'>> & { nom: string; centreId: string; categoria?: string | string[] }): Promise<string | null> {
  if (!supabase) return null;
  const id = `rec${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
  let slug = normalizeSlug(data.nom);
  if (data.barri) slug += `-${normalizeSlug(data.barri)}`;
  if (!slug.endsWith('-girona')) slug = `${slug}-girona`;

  const centre = await getDbCentreById(data.centreId);
  const categoriesArray = Array.isArray(data.categoria) ? data.categoria : (data.categoria ? [data.categoria] : []);

  const record = {
    id,
    slug,
    nom: data.nom,
    centre: centre?.nom || '',
    centre_id: data.centreId,
    barri: data.barri || '',
    categoria: categoriesArray[0] || '',
    categories: categoriesArray,
    edat: data.edat || '',
    preu: data.preu || '',
    destacada: !!data.destacada,
    centre_interessat: !!centre?.interessat,
    destacada_gran: !!data.destacada_gran,
    horari: data.horari || '',
    dies: data.dies || '',
    descripcio: data.descripcio || '',
    durada: data.durada || '',
    alumnes: data.alumnes || '',
    material: data.material || '',
    inici: data.inici || '',
    idioma: data.idioma || '',
    qui_imparteix: data.qui_imparteix || '',
    publicada: data.publicada !== undefined ? data.publicada : true,
    imatge_url: data.imatgeUrl || '',
    imatge_thumbnail_url: data.imatgeThumbnailUrl || data.imatgeUrl || '',
    galeria: data.galeria || [],
    subcategoria: data.subcategoria || '',
    tipus: data.tipus || 'Extraescolar',
    torns: data.torns || '',
    poblacio_propia: data.poblacio_propia || '',
    adreca_propia: data.adreca_propia || '',
    ciutat: 'girona'
  };

  const { error } = await supabase.from('activitats').insert([record]);
  if (error) {
    console.error('[Supabase DB] Error creant activitat:', error);
    return null;
  }
  return id;
}

export async function updateDbActivitat(id: string, data: Partial<Omit<Activitat, 'categoria'>> & { categoria?: string | string[] }): Promise<boolean> {
  if (!supabase || !id) return false;
  const updates: Record<string, any> = {};

  if (data.nom !== undefined) updates.nom = data.nom;
  if (data.barri !== undefined) updates.barri = data.barri;
  if (data.categoria !== undefined) {
    const cats = Array.isArray(data.categoria) ? data.categoria : [data.categoria];
    updates.categoria = cats[0] || '';
    updates.categories = cats;
  }
  if (data.edat !== undefined) updates.edat = data.edat;
  if (data.preu !== undefined) updates.preu = data.preu;
  if (data.destacada !== undefined) updates.destacada = data.destacada;
  if (data.destacada_gran !== undefined) updates.destacada_gran = data.destacada_gran;
  if (data.horari !== undefined) updates.horari = data.horari;
  if (data.dies !== undefined) updates.dies = data.dies;
  if (data.descripcio !== undefined) updates.descripcio = data.descripcio;
  if (data.durada !== undefined) updates.durada = data.durada;
  if (data.alumnes !== undefined) updates.alumnes = data.alumnes;
  if (data.material !== undefined) updates.material = data.material;
  if (data.inici !== undefined) updates.inici = data.inici;
  if (data.idioma !== undefined) updates.idioma = data.idioma;
  if (data.qui_imparteix !== undefined) updates.qui_imparteix = data.qui_imparteix;
  if (data.publicada !== undefined) updates.publicada = data.publicada;
  if (data.imatgeUrl !== undefined) {
    updates.imatge_url = data.imatgeUrl;
    updates.imatge_thumbnail_url = data.imatgeThumbnailUrl || data.imatgeUrl;
  }
  if (data.galeria !== undefined) updates.galeria = data.galeria;
  if (data.subcategoria !== undefined) updates.subcategoria = data.subcategoria;
  if (data.tipus !== undefined) updates.tipus = data.tipus;
  if (data.torns !== undefined) updates.torns = data.torns;
  if (data.poblacio_propia !== undefined) updates.poblacio_propia = data.poblacio_propia;
  if (data.adreca_propia !== undefined) updates.adreca_propia = data.adreca_propia;

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('activitats').update(updates).eq('id', id);
  if (error) {
    console.error('[Supabase DB] Error actualitzant activitat:', error);
    return false;
  }
  return true;
}

export async function deleteDbActivitat(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('activitats').delete().eq('id', id);
  return !error;
}

export async function getDbActivitatRawById(id: string): Promise<Activitat | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('activitats').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapSupabaseActivitat(data);
}

// ─── 2. CENTRES ────────────────────────────────────────────────────────────

export async function getDbCentres(ciutat: string = 'girona'): Promise<Centre[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('centres').select('*').eq('ciutat', ciutat).order('nom');
  if (error) return [];
  return (data || []).map(mapSupabaseCentre);
}

export async function getDbCentreBySlug(slug: string, ciutat: string = 'girona'): Promise<Centre | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('centres').select('*').eq('ciutat', ciutat).eq('slug', slug).single();
  if (error || !data) return null;
  return mapSupabaseCentre(data);
}

export async function getDbCentreById(id: string): Promise<Centre | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('centres').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapSupabaseCentre(data);
}

export async function updateDbCentre(id: string, data: Partial<Centre>): Promise<boolean> {
  if (!supabase || !id) return false;
  const updates: Record<string, any> = {};
  if (data.nom !== undefined) updates.nom = data.nom;
  if (data.adreca !== undefined) updates.adreca = data.adreca;
  if (data.telefon !== undefined) updates.telefon = data.telefon;
  if (data.email !== undefined) updates.email = data.email;
  if (data.web !== undefined) updates.web = data.web;
  if (data.barri !== undefined) updates.barri = data.barri;
  if (data.descripcio !== undefined) updates.descripcio = data.descripcio;
  if (data.imatgeUrl !== undefined) updates.imatge_url = data.imatgeUrl;
  if (data.interessat !== undefined) updates.interessat = data.interessat;
  if (data.vacances !== undefined) updates.vacances = data.vacances;

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('centres').update(updates).eq('id', id);
  return !error;
}

export async function deleteDbCentre(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  // 1. Esborrar activitats del centre
  await supabase.from('activitats').delete().eq('centre_id', id);
  // 2. Esborrar usuaris vinculats al centre
  await supabase.from('usuaris_centres').delete().eq('centre_id', id);
  // 3. Esborrar el centre
  const { error } = await supabase.from('centres').delete().eq('id', id);
  if (error) {
    console.error('[Supabase DB] Error esborrant centre:', error);
    return false;
  }
  return true;
}

// ─── 3. CATEGORIES & SUBCATEGORIES ─────────────────────────────────────────

export async function getDbCategories(ciutat: string = 'girona'): Promise<CategoryRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('categories').select('*').eq('ciutat', ciutat).order('ordre');
  return (data || []).map(r => ({
    id: r.id,
    nom: r.nom,
    slug: r.slug,
    icona: r.icona || '',
    ordre: r.ordre || 0
  }));
}

export async function getDbSubcategories(ciutat: string = 'girona'): Promise<SubcategoryRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('subcategories').select('*').eq('ciutat', ciutat).order('nom');
  return (data || []).map(r => ({
    id: r.id,
    nom: r.nom,
    categoria: r.categoria || 'General'
  }));
}

export async function createDbCategory(nom: string, icona = '', ordre = 0, ciutat: string = 'girona'): Promise<string | null> {
  if (!supabase || !nom) return null;
  const id = `cat_${Math.random().toString(36).substring(2, 8)}`;
  const slug = normalizeSlug(nom);
  const { error } = await supabase.from('categories').insert([{ id, nom, slug, icona, ordre, ciutat }]);
  if (error) {
    console.error('[Supabase DB] Error creant categoria:', error);
    return null;
  }
  return id;
}

export async function updateDbCategory(id: string, nom: string, icona?: string, ordre?: number): Promise<boolean> {
  if (!supabase || !id) return false;
  const updates: Record<string, any> = { nom, slug: normalizeSlug(nom) };
  if (icona !== undefined) updates.icona = icona;
  if (ordre !== undefined) updates.ordre = ordre;
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  return !error;
}

export async function deleteDbCategory(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return !error;
}

export async function createDbSubcategory(nom: string, categoria: string, ciutat: string = 'girona'): Promise<string | null> {
  if (!supabase || !nom) return null;
  const id = `rec${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
  const { error } = await supabase.from('subcategories').insert([{ id, nom, categoria, ciutat }]);
  if (error) return null;
  return id;
}

export async function deleteDbSubcategory(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  return !error;
}


// ─── 4. SPONSORS ───────────────────────────────────────────────────────────

export async function getDbSponsors(ciutat: string = 'girona'): Promise<Sponsor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('sponsors').select('*').eq('ciutat', ciutat);
  if (error) return [];
  return (data || []).map(r => ({
    id: r.id,
    nom: r.nom,
    categoriaSlug: r.categoria_slug,
    imatgeUrl: r.imatge_url || '',
    enllac: r.enllac || '',
    actiu: !!r.actiu,
    descripcio: r.descripcio || '',
    imatgeFonsUrl: r.imatge_fons_url || '',
    imatgeFonsMobilUrl: r.imatge_fons_mobil_url || '',
    titol: r.titol || '',
    posicioFons: r.posicio_fons || '',
  }));
}

export async function createDbSponsor(data: Partial<Sponsor> & { nom: string }, ciutat: string = 'girona'): Promise<string | null> {
  if (!supabase || !data.nom) {
    console.error("[createDbSponsor] Error: falta client supabase o data.nom", data);
    return null;
  }
  const id = `sp_${Math.random().toString(36).substring(2, 8)}`;
  const record: Record<string, any> = {
    id,
    nom: data.nom,
    categoria_slug: data.categoriaSlug || 'general',
    imatge_url: data.imatgeUrl || '',
    enllac: data.enllac || '',
    actiu: data.actiu !== undefined ? data.actiu : true,
    descripcio: data.descripcio || '',
    imatge_fons_url: data.imatgeFonsUrl || '',
    titol: data.titol || '',
    ciutat
  };
  if (data.imatgeFonsMobilUrl) {
    record.imatge_fons_mobil_url = data.imatgeFonsMobilUrl;
  }

  let { error } = await supabase.from('sponsors').insert([record]);
  
  if (error && (error.code === 'PGRST204' || error.message?.includes('imatge_fons_mobil_url'))) {
    console.warn("[createDbSponsor] Columna imatge_fons_mobil_url no trobada a Supabase, reintentant sense aquesta columna...");
    delete record.imatge_fons_mobil_url;
    const retry = await supabase.from('sponsors').insert([record]);
    error = retry.error;
  }

  if (error) {
    console.error("[createDbSponsor] Supabase Insert Error:", error);
    return null;
  }
  return id;
}

export async function updateDbSponsor(id: string, data: Partial<Sponsor>): Promise<boolean> {
  if (!supabase || !id) return false;
  const updates: Record<string, any> = {};
  if (data.nom !== undefined) updates.nom = data.nom;
  if (data.categoriaSlug !== undefined) updates.categoria_slug = data.categoriaSlug;
  if (data.imatgeUrl !== undefined) updates.imatge_url = data.imatgeUrl;
  if (data.enllac !== undefined) updates.enllac = data.enllac;
  if (data.actiu !== undefined) updates.actiu = data.actiu;
  if (data.descripcio !== undefined) updates.descripcio = data.descripcio;
  if (data.imatgeFonsUrl !== undefined) updates.imatge_fons_url = data.imatgeFonsUrl;
  if (data.imatgeFonsMobilUrl !== undefined) updates.imatge_fons_mobil_url = data.imatgeFonsMobilUrl;
  if (data.titol !== undefined) updates.titol = data.titol;

  let { error } = await supabase.from('sponsors').update(updates).eq('id', id);

  if (error && (error.code === 'PGRST204' || error.message?.includes('imatge_fons_mobil_url')) && updates.imatge_fons_mobil_url) {
    console.warn("[updateDbSponsor] Columna imatge_fons_mobil_url no trobada a Supabase, reintentant sense aquesta columna...");
    delete updates.imatge_fons_mobil_url;
    const retry = await supabase.from('sponsors').update(updates).eq('id', id);
    error = retry.error;
  }

  if (error) {
    console.error("[updateDbSponsor] Supabase Update Error:", error);
  }
  return !error;
}

export async function deleteDbSponsor(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  return !error;
}

// ─── 5. CASALS BANNERS ──────────────────────────────────────────────────────

export async function getDbCasalsBanners(ciutat: string = 'girona'): Promise<CasalsBanner[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('casals_banners').select('*').eq('ciutat', ciutat).order('nom');
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id,
    nom: r.nom,
    actiu: !!r.actiu,
    kicker: r.kicker || '',
    titol: r.titol || '',
    subtitol: r.subtitol || '',
    dates: r.dates || '',
    dataLimit: r.data_limit || '',
    dataInici: r.data_inici || '',
    dataFi: r.data_fi || ''
  }));
}

export async function getDbCasalsBanner(ciutat: string = 'girona'): Promise<CasalsBanner | null> {
  if (!supabase) return null;
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('casals_banners').select('*').eq('ciutat', ciutat).eq('actiu', true);
  if (error || !data || data.length === 0) return null;

  const activeBanner = data.find(r => {
    if (r.data_inici && r.data_inici > today) return false;
    if (r.data_fi && r.data_fi < today) return false;
    return true;
  }) || data[0];

  return {
    id: activeBanner.id,
    nom: activeBanner.nom,
    actiu: !!activeBanner.actiu,
    kicker: activeBanner.kicker || '',
    titol: activeBanner.titol || '',
    subtitol: activeBanner.subtitol || '',
    dates: activeBanner.dates || '',
    dataLimit: activeBanner.data_limit || '',
    dataInici: activeBanner.data_inici || '',
    dataFi: activeBanner.data_fi || ''
  };
}

export async function createDbCasalsBanner(
  nom: string, 
  titol: string, 
  subtitol: string, 
  dataLimit: string, 
  dataInici: string = '', 
  dataFi: string = '', 
  ciutat: string = 'girona'
): Promise<string | null> {
  if (!supabase || !nom) return null;
  const id = `casal_${Math.random().toString(36).substring(2, 8)}`;
  const { error } = await supabase.from('casals_banners').insert([{
    id,
    nom,
    titol,
    subtitol,
    data_limit: dataLimit,
    data_inici: dataInici,
    data_fi: dataFi,
    actiu: true,
    ciutat
  }]);
  if (error) return null;
  return id;
}

export async function updateDbCasalsBanner(id: string, data: Partial<CasalsBanner>): Promise<boolean> {
  if (!supabase || !id) return false;
  const updates: Record<string, any> = {};
  if (data.nom !== undefined) updates.nom = data.nom;
  if (data.actiu !== undefined) updates.actiu = data.actiu;
  if (data.kicker !== undefined) updates.kicker = data.kicker;
  if (data.titol !== undefined) updates.titol = data.titol;
  if (data.subtitol !== undefined) updates.subtitol = data.subtitol;
  if (data.dates !== undefined) updates.dates = data.dates;
  if (data.dataLimit !== undefined) updates.data_limit = data.dataLimit;
  if (data.dataInici !== undefined) updates.data_inici = data.dataInici;
  if (data.dataFi !== undefined) updates.data_fi = data.dataFi;

  const { error } = await supabase.from('casals_banners').update(updates).eq('id', id);
  return !error;
}

export async function deleteDbCasalsBanner(id: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('casals_banners').delete().eq('id', id);
  return !error;
}


// ─── 6. USUARIS CENTRES ─────────────────────────────────────────────────────

export async function getDbUsuaris(ciutat: string = 'girona'): Promise<UserRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('usuaris_centres').select('*').eq('ciutat', ciutat);
  const centres = await getDbCentres(ciutat);
  const centreMap = new Map(centres.map(c => [c.id || '', c.nom]));

  return (data || []).map(r => ({
    id: r.id,
    email: r.email,
    nom: r.nom || '',
    centreId: r.centre_id || '',
    nomCentre: centreMap.get(r.centre_id || '') || 'Sense centre',
    passwordHash: r.password_hash || '',
    aprovat: r.aprovat !== undefined ? !!r.aprovat : false,
    isAdmin: !!r.is_admin
  }));
}

export async function getDbUserByEmail(email: string) {
  if (!supabase || !email) return null;
  const { data, error } = await supabase
    .from('usuaris_centres')
    .select('*')
    .ilike('email', email.toLowerCase().trim())
    .limit(1);

  if (error || !data || data.length === 0) return null;
  const r = data[0];
  const cleanEmail = (r.email || '').toLowerCase().trim();
  const isAdmin = cleanEmail === 'hola@gironaxics.cat' || !!r.is_admin;
  const isApproved = r.aprovat !== undefined ? !!r.aprovat : false;

  return {
    id: r.id,
    nom: r.nom || r.email.split('@')[0],
    email: r.email,
    passwordHash: r.password_hash || '',
    centreId: r.centre_id || null,
    aprovat: isAdmin ? true : isApproved,
    isAdmin,
  };
}

export async function getDbUserById(id: string): Promise<UserRecord | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('usuaris_centres').select('*').eq('id', id).single();
  if (error || !data) return null;
  const centres = await getDbCentres();
  const centreMap = new Map(centres.map(c => [c.id || '', c.nom]));

  return {
    id: data.id,
    email: data.email,
    nom: data.nom || '',
    centreId: data.centre_id || '',
    nomCentre: centreMap.get(data.centre_id || '') || 'Sense centre',
    passwordHash: data.password_hash || '',
    aprovat: data.aprovat !== undefined ? !!data.aprovat : false,
    isAdmin: !!data.is_admin
  };
}

export async function updateDbUsuariAprovat(id: string, aprovat: boolean): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('usuaris_centres').update({ aprovat }).eq('id', id);
  return !error;
}

export async function updateDbUsuariCentre(id: string, centreId: string): Promise<boolean> {
  if (!supabase || !id) return false;
  const { error } = await supabase.from('usuaris_centres').update({ centre_id: centreId }).eq('id', id);
  return !error;
}

export async function createDbCentre(nom: string, ciutat: string = 'girona'): Promise<{ id: string } | null> {
  if (!supabase || !nom) return null;
  const slug = nom.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const id = `c_${Math.random().toString(36).substring(2, 8)}`;
  
  const record = {
    id,
    slug,
    nom,
    adreca: '',
    telefon: '',
    email: '',
    web: '',
    barri: 'Girona',
    descripcio: '',
    ciutat
  };
  const { error } = await supabase.from('centres').insert([record]);
  if (error) {
    console.error("[createDbCentre] Supabase error:", error);
    return null;
  }
  return { id };
}

export async function createDbUsuari(user: { nom: string; email: string; passwordHash: string; centreId: string }, ciutat: string = 'girona'): Promise<{ id: string } | null> {
  if (!supabase || !user.email) return null;
  const id = `u_${Math.random().toString(36).substring(2, 8)}`;
  const record: Record<string, any> = {
    id,
    nom: user.nom,
    email: user.email.toLowerCase().trim(),
    password_hash: user.passwordHash,
    centre_id: user.centreId,
    aprovat: false,
    ciutat
  };
  let { error } = await supabase.from('usuaris_centres').insert([record]);
  if (error && (error.code === 'PGRST204' || error.message?.includes('nom') || error.message?.includes('aprovat'))) {
    console.warn("[createDbUsuari] Columnes nom/aprovat no trobades a Supabase, reintentant sense aquestes columnes...");
    delete record.nom;
    delete record.aprovat;
    const retry = await supabase.from('usuaris_centres').insert([record]);
    error = retry.error;
  }
  if (error) {
    console.error("[createDbUsuari] Supabase error:", error);
    return null;
  }
  return { id };
}


// ─── 7. POBLACIONS ──────────────────────────────────────────────────────────

export async function getDbPoblacions(ciutat: string = 'girona'): Promise<PoblacioRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('poblacions').select('*').eq('ciutat', ciutat).order('nom');
  return (data || []).map(r => ({
    nom: r.nom,
    comarca: r.comarca || ''
  }));
}

// ─── 8. ANALYTICS ───────────────────────────────────────────────────────────

export async function recordDbAnalyticsEvent(event_type: string, event_label: string, category_name = '', device = 'desktop', centre_id?: string) {
  if (!supabase) return;
  await supabase.from('analytics').insert([{
    event_type,
    event_label,
    category_name,
    device,
    centre_id: centre_id || null,
    ciutat: 'girona'
  }]);
}

export async function getDbAnalytics(ciutat: string = 'girona'): Promise<AnalyticsRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('analytics').select('*').eq('ciutat', ciutat).order('created_at', { ascending: false }).limit(1000);
  return (data || []).map(r => ({
    id: r.id,
    event_type: r.event_type,
    event_label: r.event_label,
    category_name: r.category_name || '',
    device: r.device || 'desktop',
    centre_id: r.centre_id || '',
    created_at: r.created_at
  }));
}
