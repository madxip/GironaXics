import { Activitat, Centre, Sponsor } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';
import { normalizeSlug } from './utils';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Cache en memòria compatible amb entorns serverless (Vercel, etc.)
// El sistema de cache basat en fitxers (fs) no funciona en serverless perquè el FS és read-only.
const CACHE_TTL = 5 * 60 * 1000; // 5 minuts de validesa de la cache

interface CacheStructure {
  activitats?: {
    timestamp: number;
    data: Activitat[];
  };
  centres?: {
    timestamp: number;
    data: Centre[];
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
  if (data.centres !== undefined) {
    memoryCache.centres = data.centres;
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

export async function getActivitats(): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    console.warn("Manca AIRTABLE_API_KEY o AIRTABLE_BASE_ID. Utilitzant dades de prova.");
    return getFallbackActivitats().map(a => {
      let slug = a.slug || '';
      if (!slug.endsWith('-girona')) {
        slug = slug ? `${slug}-girona` : 'girona';
      }
      // Let's add mock centre images for beautiful fallback design!
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

  // 1. Intentar llegir la memòria cau local (cache) per reduir consum de crides a Airtable
  const cache = readCache();
  const now = Date.now();
  if (cache.activitats && (now - cache.activitats.timestamp < CACHE_TTL)) {
    return cache.activitats.data;
  }

  try {
    const records = await fetchAllRecords('Activitats', '{publicada}=TRUE()');

    let centresRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      centresRecords = await fetchAllRecords('Centres');
    } catch {
      // Ignore
    }

    const centreMap = new Map<string, string>();
    const centreImatgeMap = new Map<string, string>();
    const centreInteressatMap = new Map<string, boolean>();

    centresRecords.forEach((c) => {
      if (c.fields && c.fields.nom) {
        centreMap.set(c.id, c.fields.nom as string);
      }
      if (c.fields) {
        const attachmentField = c.fields.Imatge || c.fields.imatge || c.fields.Logo || c.fields.logo || c.fields.Logotip || c.fields.logotip;
        if (Array.isArray(attachmentField) && attachmentField.length > 0) {
          const url = (attachmentField[0] as { url: string }).url;
          centreImatgeMap.set(c.id, url);
          if (c.fields.nom) {
            centreImatgeMap.set(c.fields.nom as string, url);
          }
        }
        // Mapear si el centre ha confirmat participació
        const interessat = !!(c.fields.interessat || c.fields.Interessat || c.fields['col·laborador'] || c.fields['Col·laborador'] || c.fields.partner || c.fields.Partner);
        centreInteressatMap.set(c.id, interessat);
        if (c.fields.nom) {
          centreInteressatMap.set(c.fields.nom as string, interessat);
        }
      }
    });

    const formattedActivitats = records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Activitat;
      f.id = r.id;
      f.centreId = Array.isArray(r.fields.centre) && r.fields.centre.length > 0 ? (r.fields.centre[0] as string) : undefined;

      if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
        f.centreImatgeUrl = centreImatgeMap.get(r.fields.centre[0] as string);
        f.centreInteressat = centreInteressatMap.get(r.fields.centre[0] as string) || false;
      }
      if (!f.centreImatgeUrl && f.centre) {
        f.centreImatgeUrl = centreImatgeMap.get(f.centre);
      }

      if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
        f.imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
      }
      if (Array.isArray(r.fields.Galeria)) {
        f.galeria = (r.fields.Galeria as { url: string }[]).map((img) => img.url);
      } else {
        f.galeria = [];
      }
      f.material = (r.fields['descripció'] as string) || "";
      if (f.barri === 'Centro') {
        f.barri = 'Centre';
      }
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);
      f.tipus = (r.fields.tipus as string) || (r.fields.Tipus as string) || "Extraescolar";

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

        // Strip intermediate trailing "-girona" to avoid duplicates
        if (centrePart.endsWith('-girona')) {
          centrePart = centrePart.slice(0, -7);
        }
        if (barriPart.endsWith('-girona')) {
          barriPart = barriPart.slice(0, -7);
        }

        const parts = [tempSlug];
        // Only append if not already present in the custom slug to prevent duplicates
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

        // Strip intermediate trailing "-girona" to avoid duplicates
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

      // Ensure slug ends with '-girona'
      if (f.slug && !f.slug.endsWith('-girona')) {
        f.slug = `${f.slug}-girona`;
      }

      f.destacada_gran = !!r.fields.destacada_gran || !!r.fields['Destacada gran'] || !!r.fields['Destacada Gran'];
      const rawSub = r.fields.subcategoria || r.fields.Subcategoria || r.fields['Sub-categoria'] || r.fields['sub-categoria'];
      f.subcategoria = Array.isArray(rawSub) ? (rawSub[0] as string) : (rawSub as string);

      return f;
    });

    // 2. Desar les dades formatades a la memòria cau local
    const updatedCache = readCache();
    updatedCache.activitats = {
      timestamp: Date.now(),
      data: formattedActivitats
    };
    writeCache(updatedCache);

    return formattedActivitats;
  } catch (error) {
    console.error("[Airtable API] Error en getActivitats:", error);
    // 3. Fallback d'emergència: si Airtable falla o excedeix quota, fer servir la darrera cache existent si està disponible
    if (cache.activitats) {
      console.warn("[Airtable Cache] Fallback activat. Retornant cache anterior per evitar errors visualitzadors.");
      return cache.activitats.data;
    }
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

export async function getCentres(): Promise<Centre[]> {
  if (!API_KEY || !BASE_ID) {
    // Return empty or mock
    return [];
  }

  // 1. Intentar llegir la memòria cau local (cache) per reduir consum de crides a Airtable
  const cache = readCache();
  const now = Date.now();
  if (cache.centres && (now - cache.centres.timestamp < CACHE_TTL)) {
    return cache.centres.data;
  }

  try {
    const records = await fetchAllRecords('Centres');
    const formattedCentres = records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Centre;
      f.id = r.id;
      f.adreca = (r.fields.adreça || r.fields.adreca || "") as string;

      // Robust logo/image mapping from Airtable for Centre
      const attachmentField = r.fields.Imatge || r.fields.imatge || r.fields.Logo || r.fields.logo || r.fields.Logotip || r.fields.logotip;
      if (Array.isArray(attachmentField) && attachmentField.length > 0) {
        f.imatgeUrl = (attachmentField[0] as { url: string }).url;
      }

      // Robust slug fallback: use slug field (lowercase or uppercase) or generate from name or fallback to record ID
      const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
      f.slug = customSlug ? normalizeSlug(customSlug) : (r.fields.nom ? normalizeSlug(r.fields.nom as string) : r.id);

      // Mapear si el centre ha confirmat participació (casella Airtable)
      f.interessat = !!(r.fields.interessat || r.fields.Interessat || r.fields['col·laborador'] || r.fields['Col·laborador'] || r.fields.partner || r.fields.Partner);

      return f;
    });

    // 2. Desar les dades formatades a la memòria cau local
    const updatedCache = readCache();
    updatedCache.centres = {
      timestamp: Date.now(),
      data: formattedCentres
    };
    writeCache(updatedCache);

    return formattedCentres;
  } catch (error) {
    console.error("[Airtable API] Error en getCentres:", error);
    // 3. Fallback d'emergència: si Airtable falla, fer servir la darrera cache de centres existent
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

export async function getUserByEmail(email: string): Promise<{ id: string; nom: string; email: string; passwordHash: string; centreId: string | null; aprovat: boolean } | null> {
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

export async function createCentre(nom: string): Promise<{ id: string; nom: string } | null> {
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


export async function getActivitatsByCentreId(centreId: string): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    return getFallbackActivitats().filter(a => a.centreId === centreId);
  }
  try {
    // Obtenim totes les activitats per filtrar-les posteriorment en memòria,
    // ja que Airtable avalua el camp de relació {centre} com a cadena de text (nom) en les seves fórmules,
    // fent que filterByFormula amb l'ID de centre falli o no retorni resultats de manera consistent.
    const records = await fetchAllRecords('Activitats');

    let centresRecords: { id: string; fields: Record<string, unknown> }[] = [];
    try {
      centresRecords = await fetchAllRecords('Centres');
    } catch {}
    const centreMap = new Map<string, string>();
    const centreImatgeMap = new Map<string, string>();
    centresRecords.forEach((c) => {
      if (c.fields && c.fields.nom) centreMap.set(c.id, c.fields.nom as string);
      if (c.fields) {
        const attachmentField = c.fields.Imatge || c.fields.imatge || c.fields.Logo || c.fields.logo || c.fields.Logotip || c.fields.logotip;
        if (Array.isArray(attachmentField) && attachmentField.length > 0) {
          const url = (attachmentField[0] as { url: string }).url;
          centreImatgeMap.set(c.id, url);
          if (c.fields.nom) centreImatgeMap.set(c.fields.nom as string, url);
        }
      }
    });

    const mapped = records.map((r) => {
      const f = { ...r.fields } as unknown as Activitat;
      f.id = r.id;
      f.centreId = Array.isArray(r.fields.centre) && r.fields.centre.length > 0 ? (r.fields.centre[0] as string) : undefined;
      if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
        f.centreImatgeUrl = centreImatgeMap.get(r.fields.centre[0] as string);
      }
      if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
        f.imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
      }
      if (Array.isArray(r.fields.Galeria)) {
        f.galeria = (r.fields.Galeria as { url: string }[]).map((img) => img.url);
      } else {
        f.galeria = [];
      }
      f.material = (r.fields['descripció'] as string) || "";
      if (f.barri === 'Centro') f.barri = 'Centre';
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);

      const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
      if (customSlug) {
        let tempSlug = normalizeSlug(customSlug);
        if (tempSlug.endsWith('-girona')) tempSlug = tempSlug.slice(0, -7);
        let centrePart = f.centre ? normalizeSlug(f.centre) : '';
        let barriPart = f.barri ? normalizeSlug(f.barri) : '';
        if (centrePart.endsWith('-girona')) centrePart = centrePart.slice(0, -7);
        if (barriPart.endsWith('-girona')) barriPart = barriPart.slice(0, -7);
        const parts = [tempSlug];
        if (centrePart && !tempSlug.includes(centrePart)) parts.push(centrePart);
        if (barriPart && !tempSlug.includes(barriPart)) parts.push(barriPart);
        f.slug = parts.filter(Boolean).join('-');
      } else {
        const namePart = r.fields.nom ? normalizeSlug(r.fields.nom as string) : '';
        let centrePart = f.centre ? normalizeSlug(f.centre) : '';
        let barriPart = f.barri ? normalizeSlug(f.barri) : '';
        if (centrePart.endsWith('-girona')) centrePart = centrePart.slice(0, -7);
        if (barriPart.endsWith('-girona')) barriPart = barriPart.slice(0, -7);
        const parts = [namePart];
        if (centrePart) parts.push(centrePart);
        if (barriPart) parts.push(barriPart);
        f.slug = parts.filter(Boolean).join('-');
      }
      if (f.slug && !f.slug.endsWith('-girona')) f.slug = `${f.slug}-girona`;

      f.publicada = !!r.fields.publicada;
      f.destacada = !!r.fields.destacada;
      f.destacada_gran = !!r.fields.destacada_gran || !!r.fields['destacada_gran'] || !!r.fields['Destacada gran'] || !!r.fields['Destacada Gran'];
      const rawSub = r.fields.subcategoria || r.fields.Subcategoria || r.fields['Sub-categoria'] || r.fields['sub-categoria'];
      f.subcategoria = Array.isArray(rawSub) ? (rawSub[0] as string) : (rawSub as string);

      return f;
    });

    // Filtrem en memòria per assegurar consistència i evitar falles de fórmules d'Airtable
    return mapped.filter((a) => a.centreId === centreId);
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
      tipus: data.tipus || "Extraescolar"
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
      const baseSlug = normalizeSlug(data.nom);
      fields.slug = baseSlug.endsWith('-girona') ? baseSlug : `${baseSlug}-girona`;
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
    if (data.descripcio !== undefined) fields.descripcio = data.descripcio;
    if (data.material !== undefined) fields["descripció"] = data.material;
    if (data.durada !== undefined) fields.durada = data.durada;
    if (data.alumnes !== undefined) fields.alumnes = data.alumnes;
    if (data.inici !== undefined) fields.inici = data.inici;
    if (data.idioma !== undefined) fields.idioma = data.idioma;
    if (data.qui_imparteix !== undefined) fields["Qui imparteix"] = data.qui_imparteix;
    if (data.publicada !== undefined) fields.publicada = data.publicada;
    if (data.tipus !== undefined) fields.tipus = data.tipus;

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
      throw new Error(`Failed to update activity: ${res.status} ${text}`);
    }

    delete memoryCache.activitats;

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

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en deleteActivitat:", error);
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
  
  try {
    const records = await fetchAllRecords('Sponsors', '{actiu}=TRUE()');
    return records.map((r: { id: string; fields: Record<string, unknown> }) => {
      let imatgeUrl = '';
      if (Array.isArray(r.fields.imatge) && r.fields.imatge.length > 0) {
        imatgeUrl = (r.fields.imatge[0] as { url: string }).url;
      } else if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
        imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
      }
      
      const rawCategoria = r.fields.categoria || r.fields.Categoria || r.fields.categoria_slug || r.fields.Categoria_slug || '';
      const categoriaStr = Array.isArray(rawCategoria) 
        ? (rawCategoria[0] as string) 
        : (rawCategoria as string);

      return {
        id: r.id,
        nom: (r.fields.nom || r.fields.Nom || '') as string,
        categoriaSlug: normalizeSlug(categoriaStr),
        imatgeUrl,
        enllac: (r.fields.enllac || r.fields.Enllac || '') as string,
        actiu: !!r.fields.actiu
      };
    });
  } catch (error) {
    console.error("[Airtable API] Error en getSponsors:", error);
    return [];
  }
}
