import { Activitat, Centre } from './types';
import activitatsSeed from '../../seed/activitats-inicials.json';

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// Fallback per desenvolupament si no hi ha Airtable configurat
const getFallbackActivitats = (): Activitat[] => {
  return activitatsSeed as unknown as Activitat[];
};

async function fetchAllRecords(tableName: string, filterByFormula?: string): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  let allRecords: { id: string; fields: Record<string, unknown> }[] = [];
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

    return records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Activitat;

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
      if (f.barri === 'Centro') {
        f.barri = 'Centre';
      }
      f.qui_imparteix = (r.fields.qui_imparteix as string) || (r.fields['Qui imparteix'] as string) || (r.fields['qui imparteix'] as string);

      // Auto-generate a beautiful SEO-friendly slug: "nom-activitat-nom-centre-nom-barri-girona"
      const customSlug = (r.fields.slug as string) || (r.fields.Slug as string);
      if (customSlug) {
        f.slug = normalizeSlug(customSlug);
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
  } catch (error) {
    console.error(error);
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
  try {
    const records = await fetchAllRecords('Centres');
    return records.map((r: { id: string; fields: Record<string, unknown> }) => {
      const f = { ...r.fields } as unknown as Centre;

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
  } catch {
    return [];
  }
}

export async function getCentreBySlug(slug: string): Promise<Centre | null> {
  const all = await getCentres();
  const normalizedSearchSlug = normalizeSlug(decodeURIComponent(slug));
  return all.find(c => normalizeSlug(c.slug) === normalizedSearchSlug || (c.nom && normalizeSlug(c.nom) === normalizedSearchSlug)) || null;
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

export function generateFullSlug(baseSlug: string, barri: string): string {
  if (!baseSlug || !barri) return baseSlug;
  const barriSlug = normalizeSlug(barri);
  return `${baseSlug}-${barriSlug}`;
}

export function extractBaseSlug(fullSlug: string, barri: string): string {
  const barriSlug = normalizeSlug(barri);
  const suffix = `-${barriSlug}`;
  if (fullSlug.endsWith(suffix)) {
    return fullSlug.slice(0, -suffix.length);
  }
  return fullSlug;
}