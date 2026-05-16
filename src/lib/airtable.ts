import { Activitat, Centre } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Fallback per desenvolupament si no hi ha Airtable configurat
const getFallbackActivitats = (): Activitat[] => {
  return activitatsSeed as unknown as Activitat[];
};

export async function getActivitats(): Promise<Activitat[]> {
  if (!API_KEY || !BASE_ID) {
    console.warn("Manca AIRTABLE_API_KEY o AIRTABLE_BASE_ID. Utilitzant dades de prova.");
    return getFallbackActivitats();
  }

  try {
    const actRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Activitats?filterByFormula={publicada}=TRUE()`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store'
    });
    if (!actRes.ok) {
      const errorText = await actRes.text();
      throw new Error(`Error fetching activitats: ${actRes.status} ${errorText}`);
    }
    const data = await actRes.json();

    const centresRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Centres`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store'
    });
    const centresData = centresRes.ok ? await centresRes.json() : { records: [] };
    const centreMap = new Map<string, string>();
    centresData.records.forEach((c: { id: string; fields: { nom: string } }) => {
      if (c.fields && c.fields.nom) centreMap.set(c.id, c.fields.nom);
    });

    return data.records.map((r: { fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Activitat;
      if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
      }
      if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
        f.imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
      }
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);
      return f;
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getActivitatBySlug(slug: string): Promise<Activitat | null> {
  if (!API_KEY || !BASE_ID) {
    return getFallbackActivitats().find(a => a.slug === slug) || null;
  }
  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Activitats?filterByFormula=AND({slug}='${slug}', {publicada}=TRUE())`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store'
    });
    const data = await res.json();
    if (!data.records || data.records.length === 0) return null;

    const r = data.records[0];
    const f = { ...r.fields } as unknown as Activitat;
    
    if (Array.isArray(r.fields.centre) && r.fields.centre.length > 0) {
      const centresRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Centres`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        cache: 'no-store'
      });
      if (centresRes.ok) {
        const centresData = await centresRes.json();
        const centreMap = new Map<string, string>();
        centresData.records.forEach((c: { id: string; fields: { nom: string } }) => {
          if (c.fields && c.fields.nom) centreMap.set(c.id, c.fields.nom);
        });
        f.centre = centreMap.get(r.fields.centre[0] as string) || (r.fields.centre[0] as string);
      } else {
        f.centre = r.fields.centre[0] as string;
      }
    }
    
    if (Array.isArray(r.fields.Imatge) && r.fields.Imatge.length > 0) {
      f.imatgeUrl = (r.fields.Imatge[0] as { url: string }).url;
    }
    
    if (Array.isArray(r.fields.Galeria) && r.fields.Galeria.length > 0) {
      f.galeria = r.fields.Galeria.map((img: any) => img.url);
    }
    
    f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);
    return f;
  } catch {
    return null;
  }
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
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Centres`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return data.records.map((r: unknown) => (r as { fields: Centre }).fields);
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
