import { Activitat, Centre } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';
import fs from 'fs';
import path from 'path';
import { normalizeSlug } from './utils';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Configurar memòria cau local (cache) per estalviar quota mensual i solucionar el 429 Rate Limit
const CACHE_PATH = path.join(process.cwd(), 'src/lib/airtable-cache.json');
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

function readCache(): CacheStructure {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const content = fs.readFileSync(CACHE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Silenciós per no embullar el log, fallar en la lectura és segur
  }
  return {};
}

function writeCache(data: CacheStructure) {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("[Airtable Cache] Error escrivint el fitxer de cache:", error);
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

async function fetchAllRecords(tableName: string, filterByFormula?: string, revalidate?: number): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  let allRecords: { id: string; fields: Record<string, unknown> }[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (offset) params.append('offset', offset);

    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}${params.toString() ? '?' + params.toString() : ''}`;

    const fetchOptions: RequestInit = {
      headers: { Authorization: `Bearer ${API_KEY}` },
    };

    if (revalidate === 0) {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate: revalidate ?? 3600 };
    }

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
      }
    });

    const formattedActivitats = records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Activitat;
      f.id = r.id;
      f.centreId = Array.isArray(r.fields.centre) && r.fields.centre.length > 0 ? (r.fields.centre[0] as string) : undefined;

      if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
        f.centreImatgeUrl = centreImatgeMap.get(r.fields.centre[0] as string);
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
      f.material = "";
      if (f.barri === 'Centro') {
        f.barri = 'Centre';
      }
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);

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
  return all.filter(a => a.destacada);
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

      // Robust logo/image mapping from Airtable for Centre
      const attachmentField = r.fields.Imatge || r.fields.imatge || r.fields.Logo || r.fields.logo || r.fields.Logotip || r.fields.logotip;
      if (Array.isArray(attachmentField) && attachmentField.length > 0) {
        f.imatgeUrl = (attachmentField[0] as { url: string }).url;
      }

      // Robust slug fallback: use slug field (lowercase or uppercase) or generate from name or fallback to record ID
      const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
      f.slug = customSlug ? normalizeSlug(customSlug) : (r.fields.nom ? normalizeSlug(r.fields.nom as string) : r.id);
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
    const records = await fetchAllRecords('Usuaris_Centres', filter, 0);
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
  const all = await getActivitats();
  return all.filter(a => a.centreId === centreId);
}

export async function createActivitat(data: Omit<Activitat, 'id' | 'slug' | 'centre'> & { centreId: string }): Promise<Activitat | null> {
  if (!API_KEY || !BASE_ID) return null;
  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/Activitats`;
    
    const baseSlug = normalizeSlug(data.nom);
    const slug = baseSlug.endsWith('-girona') ? baseSlug : `${baseSlug}-girona`;
    
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
      durada: data.durada || "",
      alumnes: data.alumnes || "",
      inici: data.inici || "",
      idioma: data.idioma || "",
      "Qui imparteix": data.qui_imparteix || "",
      publicada: true,
      destacada: false
    };

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
      const cache = readCache();
      delete cache.activitats;
      writeCache(cache);
      
      return {
        id: r.id,
        nom: r.fields.nom as string,
        slug: r.fields.slug as string,
        centre: '',
        centreId: data.centreId,
        barri: r.fields.barri as string,
        categoria: r.fields.categoria as string,
        edat: r.fields.edat as string,
        preu: r.fields.preu as string,
        horari: r.fields.horari as string,
        dies: r.fields.dies as string,
        descripcio: r.fields.descripcio as string,
        durada: r.fields.durada as string,
        alumnes: r.fields.alumnes as string,
        material: "",
        inici: r.fields.inici as string,
        idioma: r.fields.idioma as string,
        qui_imparteix: (r.fields['Qui imparteix'] || r.fields.qui_imparteix) as string,
        publicada: !!r.fields.publicada,
        destacada: !!r.fields.destacada,
        imatgeUrl: Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0 ? (r.fields.Imatge[0] as { url: string }).url : undefined,
        galeria: Array.isArray(r.fields.Galeria) ? (r.fields.Galeria as { url: string }[]).map((img) => img.url) : []
      };
    }
    return null;
  } catch (error) {
    console.error("[Airtable API] Error en createActivitat:", error);
    return null;
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
    if (data.edat) fields.edat = data.edat;
    if (data.preu !== undefined) fields.preu = data.preu != null && data.preu !== '' ? String(data.preu) : null;
    if (data.horari) fields.horari = data.horari;
    if (data.dies) fields.dies = data.dies;
    if (data.descripcio !== undefined) fields.descripcio = data.descripcio;
    if (data.durada !== undefined) fields.durada = data.durada;
    if (data.alumnes !== undefined) fields.alumnes = data.alumnes;
    if (data.inici !== undefined) fields.inici = data.inici;
    if (data.idioma !== undefined) fields.idioma = data.idioma;
    if (data.qui_imparteix !== undefined) fields["Qui imparteix"] = data.qui_imparteix;
    if (data.publicada !== undefined) fields.publicada = data.publicada;

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

    const cache = readCache();
    delete cache.activitats;
    writeCache(cache);

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en updateActivitat:", error);
    return false;
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

    const cache = readCache();
    delete cache.activitats;
    writeCache(cache);

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
    if (data.adreça !== undefined) fields.adreça = data.adreça;
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
    const cache = readCache();
    delete cache.centres;
    delete cache.activitats;
    writeCache(cache);

    return true;
  } catch (error) {
    console.error("[Airtable API] Error en updateCentre:", error);
    return false;
  }
}
