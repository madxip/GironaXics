/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Activitat, Centre, Sponsor } from './types';
import { normalizeSlug } from './utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Mapeja un registre de la taula `activitats` de Supabase a la interfície `Activitat`.
 */
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

/**
 * Mapeja un registre de la taula `centres` de Supabase a la interfície `Centre`.
 */
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

// ─── CONSULTES DE LECTURA ──────────────────────────────────────────────────

export async function getDbActivitats(ciutat: string = 'girona'): Promise<Activitat[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('ciutat', ciutat)
    .eq('publicada', true)
    .order('nom');

  if (error) {
    console.error('[Supabase DB] Error obtenint activitats:', error);
    return [];
  }

  return (data || []).map(mapSupabaseActivitat);
}

export async function getAllDbActivitats(ciutat: string = 'girona'): Promise<Activitat[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('ciutat', ciutat)
    .order('nom');

  if (error) {
    console.error('[Supabase DB] Error obtenint totes les activitats:', error);
    return [];
  }

  return (data || []).map(mapSupabaseActivitat);
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
  return mapSupabaseActivitat(data);
}

export async function getDbActivitatById(id: string): Promise<Activitat | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('activitats')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapSupabaseActivitat(data);
}

export async function getDbCentres(ciutat: string = 'girona'): Promise<Centre[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('centres')
    .select('*')
    .eq('ciutat', ciutat)
    .order('nom');

  if (error) {
    console.error('[Supabase DB] Error obtenint centres:', error);
    return [];
  }

  return (data || []).map(mapSupabaseCentre);
}

export async function getDbCentreBySlug(slug: string, ciutat: string = 'girona'): Promise<Centre | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('centres')
    .select('*')
    .eq('ciutat', ciutat)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return mapSupabaseCentre(data);
}

export async function getDbCentreById(id: string): Promise<Centre | null> {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('centres')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapSupabaseCentre(data);
}

export async function getDbSponsors(ciutat: string = 'girona'): Promise<Sponsor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('ciutat', ciutat)
    .eq('actiu', true);

  if (error) {
    console.error('[Supabase DB] Error obtenint sponsors:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    nom: r.nom,
    categoriaSlug: r.categoria_slug,
    imatgeUrl: r.imatge_url || '',
    enllac: r.enllac || '',
    actiu: !!r.actiu,
    descripcio: r.descripcio || '',
    imatgeFonsUrl: r.imatge_fons_url || '',
    titol: r.titol || '',
    posicioFons: r.posicio_fons || '',
  }));
}

// ─── ESCRIPTURA I MUTACIONS (DASHBOARD & ADMIN) ───────────────────────────

export async function createDbActivitat(data: Partial<Activitat> & { nom: string; centreId: string }): Promise<string | null> {
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

export async function updateDbActivitat(id: string, data: Partial<Activitat>): Promise<boolean> {
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
  if (error) {
    console.error('[Supabase DB] Error eliminant activitat:', error);
    return false;
  }
  return true;
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
  if (error) {
    console.error('[Supabase DB] Error actualitzant centre:', error);
    return false;
  }
  return true;
}
