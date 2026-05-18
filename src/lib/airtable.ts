import { Activitat, Centre } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Fallback per desenvolupament si no hi ha Airtable configurat
const getFallbackActivitats = (): Activitat[] => {
  return activitatsSeed as unknown as Activitat[];
};

async function fetchAllRecords(tableName: string, filterByFormula?: string): Promise<{id: string; fields: Record<string, unknown>}[]> {
  let allRecords: {id: string; fields: Record<string, unknown>}[] = [];
  let offset: string | undefined;
  
  do {
    const params = new URLSearchParams();
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (offset) params.append('offset', offset);
    
    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName}${params.toString() ? '?' + params.toString() : ''}`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 3600 }
    });
    
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
    return getFallbackActivitats();
  }

  try {
    const records = await fetchAllRecords('Activitats', '{publicada}=TRUE()');

    let centresRecords: {id: string; fields: Record<string, unknown>}[] = [];
    try {
      centresRecords = await fetchAllRecords('Centres');
    } catch {
      // Ignore
    }

    const centreMap = new Map<string, string>();
    centresRecords.forEach((c) => {
      if (c.fields && c.fields.nom) centreMap.set(c.id, c.fields.nom as string);
    });

    return records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Activitat;
      
      if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
      }
      if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
        f.imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
      }
      if (f.barri === 'Centro') {
        f.barri = 'Centre';
      }
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);
      
      // Auto-generate a beautiful SEO-friendly slug: "nom-de-l-activitat-nom-del-barri"
      const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
      if (customSlug) {
        f.slug = customSlug;
      } else {
        const namePart = r.fields.nom ? normalizeSlug(r.fields.nom as string) : '';
        const barriPart = f.barri ? normalizeSlug(f.barri) : '';
        f.slug = barriPart ? `${namePart}-${barriPart}` : namePart;
        if (!f.slug) f.slug = r.id; // absolute fallback
      }
      
      return f;
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getActivitatBySlug(slug: string): Promise<Activitat | null> {
  const all = await getActivitats();
  return all.find(a => a.slug === slug) || null;
}

export async function getActivitatsByCategoria(cat: string): Promise<Activitat[]> {
  const all = await getActivitats();
  // We assume 'cat' URL param is a slug, so we normalize the categoria from data to match.
  // Example: "Arts plàstiques" -> "arts-plastiques"
  return all.filter(a => normalizeSlug(a.categoria) === cat);
}

export async function getActivitatsByBarri(barri: string): Promise<Activitat[]> {
  const all = await getActivitats();
  return all.filter(a => normalizeSlug(a.barri) === barri);
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
  try {
    const records = await fetchAllRecords('Centres');
    return records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Centre;
      // Robust slug fallback: use slug field (lowercase or uppercase) or generate from name or fallback to record ID
      f.slug = (r.fields.slug as string) || (r.fields.Slug as string) || (r.fields.nom ? normalizeSlug(r.fields.nom as string) : r.id);
      return f;
    });
  } catch {
    return [];
  }
}

export async function getCentreBySlug(slug: string): Promise<Centre | null> {
  const all = await getCentres();
  return all.find(c => c.slug === slug || (c.nom && normalizeSlug(c.nom) === slug)) || null;
}

export function normalizeSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/&/g, ' i ')             // Replace ampersand with 'i' (Catalan 'and')
    .replace(/[^a-z0-9\s-]/g, ' ')   // Replace punctuation and special characters with spaces
    .replace(/[\s-]+/g, '-')         // Collapse multiple spaces/hyphens into a single hyphen
    .replace(/^-+|-+$/g, '');        // Strip leading/trailing hyphens
}
