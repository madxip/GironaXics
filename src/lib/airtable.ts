import { Activitat, Centre, Sponsor, CasalsBanner } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';
import { normalizeSlug } from './utils';
import { unstable_cache } from 'next/cache';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Cache en memòria compatible amb entorns serverless (Vercel, etc.)
// Limitat a 90 min per evitar que les URLs d'imatges d'Airtable (expirades a ~2h) quedin obsoletes a la caché.
const CACHE_TTL = 90 * 60 * 1000; // 90 minuts

interface CacheStructure {
  activitats?: {
    timestamp: number;
    data: Activitat[];
  };
  allActivitats?: {
    timestamp: number;
    data: Activitat[];
  };
  centres?: {
    timestamp: number;
    data: Centre[];
  };
  sponsors?: {
    timestamp: number;
    data: Sponsor[];
  };
  casalsBanner?: {
    timestamp: number;
    data: CasalsBanner | null;
  };
}

// Cache global en memòria (es reinicia amb cada cold start del servidor)
const memoryCache: CacheStructure = {};

function readCache(): CacheStructure {
  return memoryCache;
}

function writeCache(data: CacheStructure) {
  if (data.activitats !== undefined) {
    memoryCache.activitats = data.activitats;
  }
  if (data.allActivitats !== undefined) {
    memoryCache.allActivitats = data.allActivitats;
  }
  if (data.centres !== undefined) {
    memoryCache.centres = data.centres;
  }
  if (data.sponsors !== undefined) {
    memoryCache.sponsors = data.sponsors;
  }
  if (data.casalsBanner !== undefined) {
    memoryCache.casalsBanner = data.casalsBanner;
  }
}

/** Neteja tota la memòria cau (activitats + centres + sponsors + casalsBanner).
 *  @param revalidateTagFn Passa `revalidateTag` des del server action per invalidar també la Next.js Data Cache. */
export function clearAllCache(revalidateTagFn?: (tag: string) => void): void {
  delete memoryCache.activitats;
  delete memoryCache.allActivitats;
  delete memoryCache.centres;
  delete memoryCache.sponsors;
  delete memoryCache.casalsBanner;
  if (revalidateTagFn) {
    try { revalidateTagFn('activitats'); } catch { /* ignore fora de request context */ }
    try { revalidateTagFn('centres'); } catch { /* ignore */ }
  }
}

// Fallback per desenvolupament si no hi ha Airtable configurat
const getFallbackActivitats = (): Activitat[] => {
  return activitatsSeed as unknown as Activitat[];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cridar a l'API amb suport de reintent automàtic amb retard exponencial (Backoff) si es rep un 429
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 300): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const waitTime = delay * Math.pow(2, i) + Math.random() * 100;
      console.warn(`[Airtable API] Rate limit (429) detectat. Reintentant en ${Math.round(waitTime)}ms... (Intent ${i + 1}/${retries})`);
      await sleep(waitTime);
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

async function fetchAllRecords(tableName: string, filterByFormula?: string): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  let allRecords: { id: string; fields: Record<string, unknown> }[] = [];
  let offset: string | undefined;
  const cb = Date.now().toString() + Math.random().toString().slice(2, 8);

  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (offset) params.append('offset', offset);
    
    // Next.js overrides global fetch and caches responses by default, which breaks Airtable
    // paginated queries when offset tokens expire on their server.
    // Instead of using 'cache: no-store' (which forces the page to opt out of static generation
    // with DYNAMIC_SERVER_USAGE), we append a unique request-level cache-busting query parameter.
    // This allows Next.js to treat the page as fully static/ISR, while ensuring that each
    // background revalidation or fresh compile fetches a brand-new page with a valid offset.
    params.append('_cb', cb);

    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}${params.toString() ? '?' + params.toString() : ''}`;

    const fetchOptions: RequestInit = {
      headers: { Authorization: `Bearer ${API_KEY}` },
    };

    const res = await fetchWithRetry(url, fetchOptions);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Error fetching ${tableName}: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function getSubcategoryRecordIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  try {
    const filter = `LOWER({Nom})="${name.toLowerCase().trim()}"`;
    const records = await fetchAllRecords('Subcategories', filter);
    if (records.length > 0) {
      return records[0].id;
    }
  } catch (err) {
    console.error(`[Airtable API] Error fetching subcategory ID for ${name}:`, err);
  }
  return null;
}

function mapActivitatRecord(
  r: { id: string; fields: Record<string, unknown> },
  centreMap: Map<string, string>,
  centreImatgeMap: Map<string, string>,
  centreInteressatMap: Map<string, boolean>,
  centreVacancesMap: Map<string, string> = new Map()
): Activitat {
  const f = { ...r.fields } as unknown as Activitat;
  f.id = r.id;
  
  const centreId = Array.isArray(r.fields.centre) && r.fields.centre.length > 0 ? (r.fields.centre[0] as string) : undefined;
  f.centreId = centreId;

  if (centreId) {
    f.centre = centreMap.get(centreId) || centreId;
    f.centreInteressat = centreInteressatMap.get(centreId) || false;
    f.centreVacances = centreVacancesMap.get(centreId);
  }

  f.material = (r.fields['descripció'] as string) || "";
  
  const rawCat = r.fields.categoria || r.fields.Categoria;
  f.categoria = Array.isArray(rawCat) ? (rawCat[0] as string) : (rawCat as string) || '';
  
  if (f.barri === 'Centro') {
    f.barri = 'Centre';
  }
  
  f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);
  f.tipus = (r.fields.tipus as string) || (r.fields.Tipus as string) || "Extraescolar";
  f.torns = (r.fields.torns as string) || (r.fields.Torns as string) || undefined;

  // Auto-generate a beautiful SEO-friendly slug: "nom-activitat-nom-centre-nom-barri-girona"
  const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
  if (customSlug) {
    let tempSlug = normalizeSlug(customSlug);
    
    // Strip final "-girona" temporarily for clean comparison
    if (tempSlug.endsWith('-girona')) {
      tempSlug = tempSlug.slice(0, -7);
    }

    let centrePart = f.centre ? normalizeSlug(f.centre) : '';
    let barriPart = f.barri ? normalizeSlug(f.barri) : '';

    if (centrePart.endsWith('-girona')) {
      centrePart = centrePart.slice(0, -7);
    }
    if (barriPart.endsWith('-girona')) {
      barriPart = barriPart.slice(0, -7);
    }

    const parts = [tempSlug];
    if (centrePart && !tempSlug.includes(centrePart)) {
      parts.push(centrePart);
    }
    if (barriPart && !tempSlug.includes(barriPart)) {
      parts.push(barriPart);
    }

    f.slug = parts.filter(Boolean).join('-');
  } else {
    const namePart = r.fields.nom ? normalizeSlug(r.fields.nom as string) : '';
    let centrePart = f.centre ? normalizeSlug(f.centre) : '';
    let barriPart = f.barri ? normalizeSlug(f.barri) : '';

    if (centrePart.endsWith('-girona')) {
      centrePart = centrePart.slice(0, -7);
    }
    if (barriPart.endsWith('-girona')) {
      barriPart = barriPart.slice(0, -7);
    }

    const parts = [namePart];
    if (centrePart) parts.push(centrePart);
    if (barriPart) parts.push(barriPart);

    f.slug = parts.filter(Boolean).join('-');
    if (!f.slug) f.slug = r.id; // absolute fallback
  }

  if (f.slug && !f.slug.endsWith('-girona')) {
    f.slug = `${f.slug}-girona`;
  }

  // Mapejar imatges usant el slug ja generat per tenir rutes proxy permanents
  if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
    const imgObj = r.fields.Imatge[0] as { url: string; thumbnails?: { large?: { url: string }; full?: { url: string } } };
    f.rawImatgeUrl = imgObj.thumbnails?.full?.url || imgObj.url;
    f.rawImatgeThumbnailUrl = imgObj.thumbnails?.large?.url || imgObj.url;
    f.imatgeUrl = `/api/imatges?type=activitat&slug=${f.slug}`;
    f.imatgeThumbnailUrl = `/api/imatges?type=activitat-thumb&slug=${f.slug}`;
  }
  
  if (Array.isArray(r.fields.Galeria)) {
    f.rawGaleria = (r.fields.Galeria as { url: string }[]).map((img) => img.url);
    f.galeria = f.rawGaleria.map((_, idx) => `/api/imatges?type=activitat-galeria&slug=${f.slug}&index=${idx}`);
  } else {
    f.rawGaleria = [];
    f.galeria = [];
  }

  // Logo permanent per al centre
  const cNomOrId = centreId || f.centre;
  if (cNomOrId) {
    const centreSlug = centreMap.get(cNomOrId) ? normalizeSlug(centreMap.get(cNomOrId)!) : normalizeSlug(cNomOrId);
    f.centreImatgeUrl = `/api/imatges?type=centre&slug=${centreSlug}`;
  }

  f.destacada = !!r.fields.destacada;
  f.publicada = !!r.fields.publicada;
  f.destacada_gran = !!r.fields.destacada_gran || !!r.fields['destacada_gran'] || !!r.fields['Destacada gran'] || !!r.fields['Destacada Gran'];
  
  const rawSub = r.fields.subcategoria || r.fields.Subcategoria || r.fields['Sub-categoria'] || r.fields['sub-categoria'];
  f.subcategoria = Array.isArray(rawSub) ? (rawSub[0] as string) : (rawSub as string);

  return f;
}

// ─── Caché Cross-Instància via Next.js unstable_cache ────────────────────────
// Totes les instàncies serverless de Vercel comparteixen aquesta caché.
// Quan un centre edita una activitat, revalidateTag('activitats') la invalida.

async function _doFetchActivitatsPublicades(): Promise<Activitat[]> {
  const records = await fetchAllRecords('Activitats', '{publicada}=TRUE()');

  let centresRecords: { id: string; fields: Record<string, unknown> }[] = [];
  try {
    centresRecords = await fetchAllRecords('Centres');
  } catch { /* ignore */ }

  const centreMap = new Map<string, string>();
  const centreImatgeMap = new Map<string, string>();
  const centreInteressatMap = new Map<string, boolean>();
  const centreVacancesMap = new Map<string, string>();

  centresRecords.forEach((c) => {
    if (c.fields?.nom) centreMap.set(c.id, c.fields.nom as string);
    if (c.fields) {
      const attachmentField = c.fields.Imatge || c.fields.imatge || c.fields.Logo || c.fields.logo || c.fields.Logotip || c.fields.logotip;
      if (Array.isArray(attachmentField) && attachmentField.length > 0) {
        const url = (attachmentField[0] as { url: string }).url;
        centreImatgeMap.set(c.id, url);
        if (c.fields.nom) centreImatgeMap.set(c.fields.nom as string, url);
      }
      const interessat = !!(c.fields.interessat || c.fields.Interessat || c.fields['col·laborador'] || c.fields['Col·laborador'] || c.fields.partner || c.fields.Partner);
      centreInteressatMap.set(c.id, interessat);
      if (c.fields.nom) centreInteressatMap.set(c.fields.nom as string, interessat);
      // Vacances
      const vac = (c.fields.vacances || c.fields.Vacances) as string | undefined;
      if (vac) centreVacancesMap.set(c.id, vac);
    }
  });

  return records.map((r) => mapActivitatRecord(r, centreMap, centreImatgeMap, centreInteressatMap, centreVacancesMap));
}

// Versió cacheada per Next.js — compartida entre totes les instàncies (90 min TTL per URLs d'imatges Airtable)
const _getCachedActivitats = unstable_cache(
  _doFetchActivitatsPublicades,
  ['gironaxics-activitats-publicades'],
  { tags: ['activitats'], revalidate: 5400 } // 90 minuts
);

export async function getActivitats(): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    console.warn("Manca AIRTABLE_API_KEY o AIRTABLE_BASE_ID. Utilitzant dades de prova.");
    return getFallbackActivitats().map(a => {
      let slug = a.slug || '';
      if (!slug.endsWith('-girona')) {
        slug = slug ? `${slug}-girona` : 'girona';
      }
      let centreImatgeUrl = '';
      if (a.centre === 'Piscina Municipal') centreImatgeUrl = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Música')) centreImatgeUrl = 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Oxford')) centreImatgeUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Dansa')) centreImatgeUrl = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Tech')) centreImatgeUrl = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Teatre')) centreImatgeUrl = 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Art')) centreImatgeUrl = 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Club')) centreImatgeUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=150&auto=format&fit=crop';
      else if (a.centre?.includes('Cuina')) centreImatgeUrl = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=150&auto=format&fit=crop';
      return { ...a, slug, centreImatgeUrl };
    });
  }

  // 1. Memòria cau local (per instància, molt ràpid)
  const cache = readCache();
  const now = Date.now();
  if (cache.activitats && (now - cache.activitats.timestamp < CACHE_TTL)) {
    return cache.activitats.data;
  }

  try {
    // 2. Caché Next.js (cross-instància, persistent entre cold starts)
    const data = await _getCachedActivitats();
    // Poblar la memòria local per a crides posteriors en la mateixa instància
    writeCache({ activitats: { timestamp: now, data } });
    return data;
  } catch (error) {
    console.error('[Airtable API] Error en getActivitats:', error);
    // 3. Fallback d'emergència: retornar cache anterior si existeix
    if (cache.activitats) {
      console.warn('[Airtable Cache] Fallback activat. Retornant cache anterior per evitar errors.');
      return cache.activitats.data;
    }
    return [];
  }
}

/**
 * Retorna TOTES les activitats sense filtre de publicació.
 * Únicament per al panell d'administrador, per poder veure i gestionar
 * activitats no publicades (esborranys) sense haver d'anar a Airtable.
 */
export async function getAllActivitats(): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    return getFallbackActivitats().map(a => ({ ...a }));
  }

  const cache = readCache();
  const now = Date.now();
  if (cache.allActivitats && (now - cache.allActivitats.timestamp < CACHE_TTL)) {
    return cache.allActivitats.data;
  }

  try {
    // Sense filtre de publicada
    const records = await fetchAllRecords('Activitats');

    let centresRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      centresRecords = await fetchAllRecords('Centres');
    } catch { /* Ignore */ }

    const centreMap = new Map<string, string>();
    const centreImatgeMap = new Map<string, string>();
    const centreInteressatMap = new Map<string, boolean>();
    const centreVacancesMap = new Map<string, string>();

    centresRecords.forEach((c) => {
      if (c.fields?.nom) centreMap.set(c.id, c.fields.nom as string);
      if (c.fields) {
        const attachmentField = c.fields.Imatge || c.fields.imatge || c.fields.Logo || c.fields.logo || c.fields.Logotip || c.fields.logotip;
        if (Array.isArray(attachmentField) && attachmentField.length > 0) {
          const url = (attachmentField[0] as { url: string }).url;
          centreImatgeMap.set(c.id, url);
          if (c.fields.nom) centreImatgeMap.set(c.fields.nom as string, url);
        }
        const interessat = !!(c.fields.interessat || c.fields.Interessat || c.fields['col·laborador'] || c.fields['Col·laborador'] || c.fields.partner || c.fields.Partner);
        centreInteressatMap.set(c.id, interessat);
        if (c.fields.nom) centreInteressatMap.set(c.fields.nom as string, interessat);
        const vac = (c.fields.vacances || c.fields.Vacances) as string | undefined;
        if (vac) centreVacancesMap.set(c.id, vac);
      }
    });

    const formattedActivitats = records.map((r) =>
      mapActivitatRecord(r, centreMap, centreImatgeMap, centreInteressatMap, centreVacancesMap)
    );

    const updatedCache = readCache();
    updatedCache.allActivitats = { timestamp: Date.now(), data: formattedActivitats };
    writeCache(updatedCache);

    return formattedActivitats;
  } catch (error) {
    console.error('[Airtable API] Error en getAllActivitats:', error);
    if (cache.allActivitats) return cache.allActivitats.data;
    return [];
  }
}

export async function getActivitatBySlug(slug: string): Promise<Activitat | null> {
  const all = await getActivitats();
  const normalizedSearchSlug = normalizeSlug(decodeURIComponent(slug));
  return all.find(a => normalizeSlug(a.slug) === normalizedSearchSlug) || null;
}

export async function getActivitatsByCategoria(cat: string): Promise<Activitat[]> {
  const all = await getActivitats();
  // We assume 'cat' URL param is a slug, so we normalize the categoria from data to match.
  // Example: "Arts plàstiques" -> "arts-plastiques"
  const normalizedCat = normalizeSlug(decodeURIComponent(cat));
  return all.filter(a => normalizeSlug(a.categoria) === normalizedCat);
}

export async function getActivitatsByBarri(barri: string): Promise<Activitat[]> {
  const all = await getActivitats();
  const normalizedBarri = normalizeSlug(decodeURIComponent(barri));
  return all.filter(a => normalizeSlug(a.barri) === normalizedBarri);
}

export async function getActivitatsDestacades(): Promise<Activitat[]> {
  const all = await getActivitats();
  const destacades = all.filter(a => a.destacada || a.destacada_gran);
  return destacades.sort((a, b) => {
    const aGran = a.destacada_gran ? 1 : 0;
    const bGran = b.destacada_gran ? 1 : 0;
    return bGran - aGran;
  });
}

async function _doFetchCentres(): Promise<Centre[]> {
  const records = await fetchAllRecords('Centres');
  const anyActiu = records.some(r => r.fields.actiu === true || r.fields.Actiu === true);
  const recordsToShow = anyActiu
    ? records.filter(r => r.fields.actiu === true || r.fields.Actiu === true)
    : records;

  return recordsToShow.map((r: { id: string; fields: Record<string, unknown> }) => {
    const f = { ...r.fields } as unknown as Centre;
    f.id = r.id;
    f.adreca = (r.fields.adreça || r.fields.adreca || "") as string;
    
    const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
    f.slug = customSlug ? normalizeSlug(customSlug) : (r.fields.nom ? normalizeSlug(r.fields.nom as string) : r.id);
    
    const attachmentField = r.fields.Imatge || r.fields.imatge || r.fields.Logo || r.fields.logo || r.fields.Logotip || r.fields.logotip;
    if (Array.isArray(attachmentField) && attachmentField.length > 0) {
      const att = attachmentField[0] as { url: string; thumbnails?: { large?: { url: string } } };
      f.rawImatgeUrl = att.thumbnails?.large?.url || att.url;
      f.imatgeUrl = `/api/imatges?type=centre&slug=${f.slug}`;
    }
    
    f.interessat = !!(r.fields.interessat || r.fields.Interessat || r.fields['col·laborador'] || r.fields['Col·laborador'] || r.fields.partner || r.fields.Partner);
    f.vacances = (r.fields.vacances || r.fields.Vacances) as string | undefined;
    return f;
  });
}

const _getCachedCentres = unstable_cache(
  _doFetchCentres,
  ['gironaxics-centres'],
  { tags: ['centres'], revalidate: 5400 } // 90 minuts
);

export async function getCentres(): Promise<Centre[]> {
  if (!API_KEY || !BASE_ID) return [];

  const cache = readCache();
  const now = Date.now();
  if (cache.centres && (now - cache.centres.timestamp < CACHE_TTL)) {
    return cache.centres.data;
  }

  try {
    const data = await _getCachedCentres();
    writeCache({ centres: { timestamp: now, data } });
    return data;
  } catch (error) {
    console.error("[Airtable API] Error en getCentres:", error);
    if (cache.centres) {
      console.warn("[Airtable Cache] Fallback activat. Retornant cache de centres anterior.");
      return cache.centres.data;
    }
    return [];
  }
}

export async function getCentreBySlug(slug: string): Promise<Centre | null> {
  const all = await getCentres();
  const normalizedSearchSlug = normalizeSlug(decodeURIComponent(slug));
  return all.find(c => normalizeSlug(c.slug) === normalizedSearchSlug || (c.nom && normalizeSlug(c.nom) === normalizedSearchSlug)) || null;
}

/**
 * Carrega un centre per ID directament des d'Airtable, sense el filtre actiu.
 * S'usa al dashboard per permetre que centres nous (no actius encara) puguin
 * editar les seves dades tot i que getCentres() els filtra del lloc públic.
 */
export async function getCentreByIdDirect(id: string): Promise<Centre | null> {
  if (!API_KEY || !BASE_ID || !id) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Centres/${encodeURIComponent(id)}`;
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const r = await res.json() as { id: string; fields: Record<string, unknown> };
    const f = { ...r.fields } as unknown as Centre;
    f.id = r.id;
    f.adreca = (r.fields.adre\u00e7a || r.fields.adreca || '') as string;
    const attachmentField = r.fields.Imatge || r.fields.imatge || r.fields.Logo || r.fields.logo || r.fields.Logotip || r.fields.logotip;
    if (Array.isArray(attachmentField) && attachmentField.length > 0) {
      const att = attachmentField[0] as { url: string; thumbnails?: { large?: { url: string } } };
      f.imatgeUrl = att.thumbnails?.large?.url || att.url;
    }
    const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
    f.slug = customSlug ? normalizeSlug(customSlug) : (r.fields.nom ? normalizeSlug(r.fields.nom as string) : r.id);
    f.interessat = !!(r.fields.interessat || r.fields.Interessat || r.fields['col\u00b7laborador'] || r.fields['Col\u00b7laborador'] || r.fields.partner || r.fields.Partner);
    f.vacances = (r.fields.vacances || r.fields.Vacances) as string | undefined;
    return f;
  } catch (error) {
    console.error('[Airtable API] Error en getCentreByIdDirect:', error);
    return null;
  }
}


export async function getUserByEmail(email: string): Promise<{ id: string; nom: string; email: string; passwordHash: string; centreId: string | null; aprovat: boolean; isAdmin: boolean } | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const filter = `LOWER({Email})="${email.toLowerCase().trim()}"`;
    const records = await fetchAllRecords('Usuaris_Centres', filter);
    if (records.length === 0) return null;
    const r = records[0];
    return {
      id: r.id,
      nom: r.fields.Nom as string,
      email: r.fields.Email as string,
      passwordHash: r.fields.PasswordHash as string,
      centreId: Array.isArray(r.fields.Centre) && r.fields.Centre.length > 0 ? (r.fields.Centre[0] as string) : null,
      aprovat: !!r.fields.Aprovat,
      isAdmin: !!r.fields.isAdmin || !!r.fields.Admin || !!r.fields.admin,
    };
  } catch (error) {
    console.error("[Airtable API] Error en getUserByEmail:", error);
    return null;
  }
}

export async function createUser(data: { nom: string; email: string; passwordHash: string; centreId: string }): Promise<{ id: string; nom: string; email: string; centreId: string | null; aprovat: boolean } | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Usuaris_Centres`;
    const body = {
      records: [
        {
          fields: {
            Nom: data.nom,
            Email: data.email.toLowerCase().trim(),
            PasswordHash: data.passwordHash,
            Centre: data.centreId ? [data.centreId] : undefined,
            Aprovat: false
          }
        }
      ]
    };
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create user: ${res.status} ${text}`);
    }
    const resData = await res.json();
    if (resData.records && resData.records.length > 0) {
      const r = resData.records[0];
      return {
        id: r.id,
        nom: r.fields.Nom as string,
        email: r.fields.Email as string,
        centreId: Array.isArray(r.fields.Centre) && r.fields.Centre.length > 0 ? (r.fields.Centre[0] as string) : null,
        aprovat: !!r.fields.Aprovat
      };
    }
    return null;
  } catch (error) {
    console.error("[Airtable API] Error en createUser:", error);
    return null;
  }
}

export async function createCentre(nom: string): Promise<{ id: string; nom: string } | { error: string } | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Centres`;
    const slug = normalizeSlug(nom);
    const body = {
      records: [
        {
          fields: {
            nom: nom,
            slug: slug,
            descripcio: "",
          }
        }
      ]
    };
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Airtable API] createCentre error: ${res.status} ${text}`);
      if (res.status === 429) {
        return { error: 'quota' };
      }
      throw new Error(`Failed to create centre: ${res.status} ${text}`);
    }
    const resData = await res.json();
    if (resData.records && resData.records.length > 0) {
      const r = resData.records[0];
      return {
        id: r.id,
        nom: r.fields.nom as string,
      };
    }
    return null;
  } catch (error) {
    console.error("[Airtable API] Error en createCentre:", error);
    return null;
  }
}


/**
 * Fetch a single Activitat record directly from Airtable by its record ID,
 * with NO publicada filter. Used for ownership/existence checks in server
 * actions so that non-published activities can still be deleted or toggled.
 */
export async function getActivitatRawById(
  id: string
): Promise<{ id: string; centreId?: string } | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats/${id}`;
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error fetching record ${id}: ${res.status} ${text}`);
    }
    const data = await res.json();
    const centreField = data.fields?.centre;
    const centreId = Array.isArray(centreField) && centreField.length > 0
      ? (centreField[0] as string)
      : undefined;
    return { id: data.id as string, centreId };
  } catch (error) {
    console.error('[Airtable API] Error en getActivitatRawById:', error);
    return null;
  }
}

export async function getActivitatsByCentreId(centreId: string): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    return getFallbackActivitats().filter(a => a.centreId === centreId);
  }
  try {
    // 1. Obtenir els centres per trobar el nom d'aquest centre (aprofitant la cache súper ràpida de getCentres)
    const centres = await getCentres();
    const targetCentre = centres.find(c => c.id === centreId);
    
    // Si no trobem el centre, retornem buit directament sense fer cap crida a l'API
    if (!targetCentre) {
      return [];
    }

    // Escapament complet: primer backslashes, després cometes dobles
    const safeName = targetCentre.nom.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const filter = `{centre}="${safeName}"`;
    const records = await fetchAllRecords('Activitats', filter);

    // 3. Mapejar els centres per poder resoldre els logos i noms de forma eficient
    const centreMap = new Map<string, string>();
    const centreImatgeMap = new Map<string, string>();
    const centreInteressatMap = new Map<string, boolean>();
    const centreVacancesMap = new Map<string, string>();

    centres.forEach((c) => {
      if (c.id) {
        if (c.nom) {
          centreMap.set(c.id, c.nom);
          centreMap.set(c.nom, c.nom);
        }
        if (c.imatgeUrl) {
          centreImatgeMap.set(c.id, c.imatgeUrl);
          if (c.nom) centreImatgeMap.set(c.nom, c.imatgeUrl);
        }
        centreInteressatMap.set(c.id, c.interessat || false);
        if (c.nom) centreInteressatMap.set(c.nom, c.interessat || false);
        if (c.vacances && c.id) centreVacancesMap.set(c.id, c.vacances);
      }
    });

    // 4. Mapejar cada activitat utilitzant la nostra funció unificada DRY mapActivitatRecord
    return records.map((r) => mapActivitatRecord(r, centreMap, centreImatgeMap, centreInteressatMap, centreVacancesMap));
  } catch (error) {
    console.error("[Airtable API] Error en getActivitatsByCentreId:", error);
    return [];
  }
}

export async function createActivitat(data: Omit<Activitat, 'id' | 'slug' | 'centre'> & { centreId: string }): Promise<Activitat | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats`;
    
    const baseSlug = normalizeSlug(data.nom);
    const slug = baseSlug.endsWith('-girona') ? baseSlug : `${baseSlug}-girona`;
    
    const subcatId = data.subcategoria ? await getSubcategoryRecordIdByName(data.subcategoria) : null;
    
    const fields: Record<string, unknown> = {
      nom: data.nom,
      slug: slug,
      centre: [data.centreId],
      barri: data.barri,
      categoria: data.categoria,
      edat: data.edat,
      preu: data.preu != null && data.preu !== '' ? String(data.preu) : undefined,
      horari: data.horari,
      dies: data.dies,
      descripcio: data.descripcio || "",
      "descripció": data.material || "",
      durada: data.durada || "",
      alumnes: data.alumnes || "",
      inici: data.inici || "",
      idioma: data.idioma || "",
      "Qui imparteix": data.qui_imparteix || "",
      publicada: true,
      destacada: false,
      tipus: data.tipus || "Extraescolar",
      torns: data.torns || null
    };

    if (subcatId) {
      fields.subcategoria_enllac = [subcatId];
    }

    if (data.imatgeUrl) {
      fields.Imatge = [{ url: data.imatgeUrl }];
    }
    if (Array.isArray(data.galeria) && data.galeria.length > 0) {
      fields.Galeria = data.galeria.map(url => ({ url }));
    }

    const body = {
      records: [
        {
          fields
        }
      ]
    };

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create activity: ${res.status} ${text}`);
    }

    const resData = await res.json();
    if (resData.records && resData.records.length > 0) {
      const r = resData.records[0];
      delete memoryCache.activitats;
      delete memoryCache.allActivitats;
      
      return {
        id: r.id,
        nom: r.fields.nom as string,
        slug: r.fields.slug as string,
        centre: '',
        centreId: data.centreId,
        barri: r.fields.barri as string,
        categoria: r.fields.categoria as string,
        subcategoria: (r.fields.subcategoria || r.fields.Subcategoria) as string,
        edat: r.fields.edat as string,
        preu: r.fields.preu as string,
        horari: r.fields.horari as string,
        dies: r.fields.dies as string,
        descripcio: r.fields.descripcio as string,
        durada: r.fields.durada as string,
        alumnes: r.fields.alumnes as string,
        material: (r.fields['descripció'] as string) || "",
        inici: r.fields.inici as string,
        idioma: r.fields.idioma as string,
        qui_imparteix: (r.fields['Qui imparteix'] || r.fields.qui_imparteix) as string,
        publicada: !!r.fields.publicada,
        destacada: !!r.fields.destacada,
        tipus: (r.fields.tipus || r.fields.Tipus) as string || "Extraescolar",
        imatgeUrl: Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0 ? (r.fields.Imatge[0] as { url: string }).url : undefined,
        imatgeThumbnailUrl: Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0 ? ((r.fields.Imatge[0] as { url: string; thumbnails?: { large?: { url: string } } }).thumbnails?.large?.url || (r.fields.Imatge[0] as { url: string }).url) : undefined,
        galeria: Array.isArray(r.fields.Galeria) ? (r.fields.Galeria as { url: string }[]).map((img) => img.url) : []
      };
    }
    return null;
  } catch (error) {
    console.error("[Airtable API] Error en createActivitat:", error);
    throw error;
  }
}

export async function updateActivitat(id: string, data: Partial<Omit<Activitat, 'id' | 'slug' | 'centre' | 'centreId'>>): Promise<boolean> {
  if (!API_KEY || !BASE_ID) return false;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats`;
    
    const fields: Record<string, unknown> = {};
    if (data.nom) {
      fields.nom = data.nom;
      // El slug (URL) NO es regenera en editar per preservar el posicionament SEO.
      // Si cal canviar la URL, s'ha de fer manualment al camp "slug" d'Airtable.
    }
    if (data.barri) fields.barri = data.barri;
    if (data.categoria) fields.categoria = data.categoria;
    if (data.subcategoria !== undefined) {
      const subcatId = data.subcategoria ? await getSubcategoryRecordIdByName(data.subcategoria) : null;
      fields.subcategoria_enllac = subcatId ? [subcatId] : [];
    }
    if (data.edat) fields.edat = data.edat;
    if (data.preu !== undefined) fields.preu = data.preu != null && data.preu !== '' ? String(data.preu) : null;
    if (data.horari) fields.horari = data.horari;
    if (data.dies) fields.dies = data.dies;
    // Camps opcionals: enviar null per netejar, no cadena buida (Airtable rebutja "" en camps de Nombre o Data)
    if (data.descripcio !== undefined) fields.descripcio = data.descripcio || null;
    if (data.material !== undefined) fields["descripció"] = data.material || null;
    if (data.durada !== undefined) fields.durada = data.durada || null;
    if (data.alumnes !== undefined) fields.alumnes = data.alumnes || null;
    if (data.inici !== undefined) fields.inici = data.inici || null;
    if (data.idioma !== undefined) fields.idioma = data.idioma || null;
    if (data.qui_imparteix !== undefined) fields["Qui imparteix"] = data.qui_imparteix || null;
    if (data.publicada !== undefined) fields.publicada = data.publicada;
    if (data.tipus !== undefined) fields.tipus = data.tipus || null;
    if (data.torns !== undefined) fields.torns = data.torns || null;

    if (data.imatgeUrl !== undefined) {
      fields.Imatge = data.imatgeUrl ? [{ url: data.imatgeUrl }] : [];
    }
    if (data.galeria !== undefined) {
      fields.Galeria = Array.isArray(data.galeria) ? data.galeria.map(url => ({ url })) : [];
    }

    const body = {
      records: [
        {
          id,
          fields
        }
      ]
    };

    const res = await fetchWithRetry(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      // Intentar extreure el missatge d'error específic de l'Airtable
      try {
        const errData = JSON.parse(text);
        const errMsg = errData?.error?.message || errData?.error?.type || text;
        throw new Error(`Airtable 422: ${errMsg}`);
      } catch {
        throw new Error(`Failed to update activity: ${res.status} ${text}`);
      }
    }

    delete memoryCache.activitats;
    delete memoryCache.allActivitats;

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en updateActivitat:", error);
    throw error;
  }
}

export async function deleteActivitat(id: string): Promise<boolean> {
  if (!API_KEY || !BASE_ID) return false;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats?records[]=${id}`;
    
    const res = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete activity: ${res.status} ${text}`);
    }

    delete memoryCache.activitats;
    delete memoryCache.allActivitats;

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en deleteActivitat:", error);
    return false;
  }
}

export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
  if (!API_KEY || !BASE_ID) return false;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Usuaris_Centres/${userId}`;
    const res = await fetchWithRetry(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: { PasswordHash: newPasswordHash } }),
    });
    return res.ok;
  } catch (error) {
    console.error('[Airtable API] Error en updateUserPassword:', error);
    return false;
  }
}

export async function updateCentre(id: string, data: Partial<Omit<Centre, 'id' | 'slug'>>): Promise<boolean> {
  if (!API_KEY || !BASE_ID) return false;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Centres`;
    
    const fields: Record<string, unknown> = {};
    if (data.nom !== undefined) {
      fields.nom = data.nom;
      fields.slug = normalizeSlug(data.nom);
    }
    if (data.adreca !== undefined) {
      fields.adreça = data.adreca;
    }
    if (data.telefon !== undefined) fields.telefon = data.telefon;
    if (data.email !== undefined) fields.email = data.email;
    if (data.web !== undefined) fields.web = data.web;
    if (data.barri !== undefined) fields.barri = data.barri;
    if (data.descripcio !== undefined) fields.descripcio = data.descripcio;

    if (data.imatgeUrl !== undefined) {
      fields.Logo = data.imatgeUrl ? [{ url: data.imatgeUrl }] : [];
    }
    if (data.vacances !== undefined) {
      fields.vacances = data.vacances || null;
    }

    const body = {
      records: [
        {
          id,
          fields
        }
      ]
    };

    const res = await fetchWithRetry(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update centre: ${res.status} ${text}`);
    }

    // Reset caches
    delete memoryCache.centres;
    delete memoryCache.activitats;

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en updateCentre:", error);
    return false;
  }
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (!API_KEY || !BASE_ID) return [];

  // Cache en memòria per reduir crides a Airtable
  const cache = readCache();
  const now = Date.now();
  if (cache.sponsors && (now - cache.sponsors.timestamp < CACHE_TTL)) {
    return cache.sponsors.data;
  }

  try {
    const records = await fetchAllRecords('Sponsors', '{actiu}=TRUE()');
    const formattedSponsors = records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = r.fields;

      // Logo del patrocinador (camp "imatge")
      let rawImatgeUrl = '';
      let imatgeUrl = '';
      const logoField = f.imatge || f.Imatge;
      if (Array.isArray(logoField) && logoField.length > 0) {
        rawImatgeUrl = (logoField[0] as { url: string }).url;
        imatgeUrl = `/api/imatges?type=sponsor-logo&id=${r.id}`;
      }

      // Imatge de fons de la targeta (camp "background")
      let rawImatgeFonsUrl = '';
      let imatgeFonsUrl = '';
      const bgField = f.background || f.Background || f.imatge_fons || f.Imatge_fons;
      if (Array.isArray(bgField) && bgField.length > 0) {
        rawImatgeFonsUrl = (bgField[0] as { url: string }).url;
        imatgeFonsUrl = `/api/imatges?type=sponsor-bg&id=${r.id}`;
      } else if (typeof bgField === 'string' && bgField) {
        rawImatgeFonsUrl = bgField;
        imatgeFonsUrl = bgField; // Si ja és una URL de text l'enllacem directament
      }

      // IMPORTANT: "categoria (from Activitat enllaçada)" retorna IDs de registre, NO noms.
      // El nom de la categoria és a "Nom (from categoria (from Activitat enllaçada))" → ["Esports"]
      let categoriaSlug = '';
      const nomCatKey = Object.keys(f).find(k => k.toLowerCase().startsWith('nom (from categor'));
      if (nomCatKey) {
        const catVal = f[nomCatKey];
        if (Array.isArray(catVal) && catVal.length > 0 && typeof catVal[0] === 'string') {
          const catName = catVal[0];
          categoriaSlug = catName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
      }
      // Fallback: camp text directe si existeix
      if (!categoriaSlug) {
        categoriaSlug = (f.categoria_slug || f.Categoria_slug || '') as string;
      }

      return {
        id: r.id,
        nom: (f.nom || f.Nom || '') as string,
        categoriaSlug,
        imatgeUrl,
        imatgeFonsUrl,
        rawImatgeUrl,
        rawImatgeFonsUrl,
        // "slogan" és el títol de la targeta a Airtable
        titol: (f.slogan || f.Slogan || f.titol || f.Titol || '') as string,
        descripcio: (f.descripcio || f.Descripcio || '') as string,
        enllac: (f.enllac || f.Enllac || '') as string,
        // Tots els registres han passat el filtre {actiu}=TRUE() d'Airtable
        actiu: true,
      };
    });

    // Desar a cache
    writeCache({ sponsors: { timestamp: Date.now(), data: formattedSponsors } });
    return formattedSponsors;
  } catch (error) {
    console.error("[Airtable API] Error en getSponsors:", error);
    if (cache.sponsors) return cache.sponsors.data;
    return [];
  }
}



export async function getCasalsBanner(): Promise<CasalsBanner | null> {
  // Cache en memòria per reduir crides a Airtable
  const cache = readCache();
  const now = Date.now();
  if (cache.casalsBanner !== undefined && (now - cache.casalsBanner.timestamp < CACHE_TTL)) {
    return cache.casalsBanner.data;
  }

  try {
    const records = await fetchAllRecords('Casals', '{actiu}=TRUE()');
    if (!records || records.length === 0) {
      writeCache({ casalsBanner: { timestamp: Date.now(), data: null } });
      return null;
    }

    // Get today's local date in YYYY-MM-DD format
    const todayStr = new Date().toLocaleDateString('sv-SE');

    for (const r of records) {
      const f = r.fields;
      
      // Look for a deadline/limit date column dynamically
      const limitKey = Object.keys(f).find(k => 
        k.toLowerCase().includes('limit') || 
        k.toLowerCase().includes('límit') || 
        k.toLowerCase().includes('deadline')
      );
      
      const rawLimit = limitKey ? f[limitKey] : undefined;
      
      if (rawLimit && typeof rawLimit === 'string') {
        const limitStr = rawLimit.split('T')[0];
        if (limitStr && todayStr > limitStr) {
          // Exceeded deadline, hide it automatically
          continue;
        }
      }
      
      // Map banner details dynamically with robust fallbacks
      const kicker = (f.kicker || f.Kicker || '') as string;
      const titol = (f.titol || f.Titol || f.Headline || '') as string;
      const subtitol = (f.subtitol || f.Subtitol || f.descripcio || f.Descripcio || '') as string;
      const dates = (f.dates || f.Dates || '') as string;
      const dataLimit = typeof rawLimit === 'string' ? rawLimit : '';

      const banner: CasalsBanner = {
        id: r.id,
        nom: (f.nom || f.Nom || '') as string,
        actiu: true,
        kicker,
        titol,
        subtitol,
        dates,
        dataLimit
      };
      writeCache({ casalsBanner: { timestamp: Date.now(), data: banner } });
      return banner;
    }
  } catch (error) {
    console.error("[Airtable API] Error en getCasalsBanner:", error);
    if (cache.casalsBanner !== undefined) return cache.casalsBanner.data;
  }
  writeCache({ casalsBanner: { timestamp: Date.now(), data: null } });
  return null;
}

