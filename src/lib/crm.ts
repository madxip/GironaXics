import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getPoblacioRecordIdByName } from './airtable';

export interface AirtableRawRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

// Disable TLS verification locally as done in the rest of the application
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface CRMCentre {
  id: string;
  nom: string;
  adreca: string;
  telefon: string;
  email: string;
  web: string;
  barri: string;
  descripcio: string;
  contactName: string;
  contactEmail: string;
  contactUserId?: string; // ID of the linked record in Usuaris_Centres
  activityCount: number;
}

export interface CRMActivity {
  id: string;
  nom: string;
  slug: string;
  centreId: string;
  centreNom: string;
  barri: string;
  categoria: string;
  edat: string;
  preu: number | string;
  horari: string;
  dies: string;
  descripcio: string;
  publicada: boolean;
  destacada: boolean;
  poblacio_propia?: string;
  tipus?: string;
}

const LOCAL_DB_PATH = path.join(process.cwd(), 'backups', 'crm_centres_cache.json');
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

// --- Helper local helpers ---
function getLocalCache(): { centres: CRMCentre[] } {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ centres: [] }, null, 2), 'utf8');
      return { centres: [] };
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[CRM Cache] Error reading cache:', err);
    return { centres: [] };
  }
}

function saveLocalCache(centres: CRMCentre[]) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ centres }, null, 2), 'utf8');
  } catch (err) {
    console.error('[CRM Cache] Error saving cache:', err);
  }
}

// --- Airtable fetching helper ---
async function fetchAllRecords(tableName: string, filterFormula?: string): Promise<AirtableRawRecord[]> {
  let allRecords: AirtableRawRecord[] = [];
  let offset: string | undefined;
  const cb = Date.now().toString() + Math.random().toString().slice(2, 8);

  do {
    const params = new URLSearchParams({ pageSize: '100', _cb: cb });
    if (filterFormula) params.append('filterByFormula', filterFormula);
    if (offset) params.append('offset', offset);

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: 'no-store'
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error fetching ${tableName}: ${res.status} ${err}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

async function fetchFromAirtable(endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${endpoint}`;
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers, cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Airtable API error ${res.status}: ${errorText}`);
  }
  return res.json();
}

// --- Public APIs ---

/**
 * Fetch all centres, matching each with their contact user from Usuaris_Centres.
 */
export async function getCentresWithContacts(): Promise<CRMCentre[]> {
  if (!API_KEY || !BASE_ID) {
    console.warn('[CRM] Airtable credentials missing. Using local cached data.');
    return getLocalCache().centres;
  }

  try {
    // 1. Fetch Centres and Users
    const centresRecords = await fetchAllRecords('Centres');
    const usersRecords = await fetchAllRecords('Usuaris_Centres');

    // 2. Map Users by Centre ID for fast lookup
    const userByCentreMap = new Map<string, { id: string; nom: string; email: string }>();
    usersRecords.forEach(u => {
      const linkedCentres = u.fields.Centre as string[]; // Array of linked record IDs
      if (Array.isArray(linkedCentres) && linkedCentres.length > 0) {
        const centreId = linkedCentres[0];
        // Save the first user linked as primary contact
        if (!userByCentreMap.has(centreId)) {
          userByCentreMap.set(centreId, {
            id: u.id,
            nom: (u.fields.Nom as string) || '',
            email: (u.fields.Email as string) || ''
          });
        }
      }
    });

    // 3. Format CRM centres
    const formattedCentres: CRMCentre[] = centresRecords.map(c => {
      const contact = userByCentreMap.get(c.id);
      return {
        id: c.id,
        nom: (c.fields.nom as string) || '',
        adreca: (c.fields.adreça as string) || (c.fields.adreca as string) || '',
        telefon: (c.fields.telefon as string) || '',
        email: (c.fields.email as string) || '',
        web: (c.fields.web as string) || '',
        barri: Array.isArray(c.fields.barri) ? (c.fields.barri[0] as string) || '' : (c.fields.barri as string) || '',
        descripcio: (c.fields.descripcio as string) || '',
        contactName: contact?.nom || '',
        contactEmail: contact?.email || '',
        contactUserId: contact?.id,
        activityCount: Array.isArray(c.fields.Activitats) ? c.fields.Activitats.length : 0
      };
    });

    // Save cache locally for offline/fallback
    saveLocalCache(formattedCentres);
    return formattedCentres;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CRM] Error loading centres from Airtable. Returning local cache.', errorMsg);
    return getLocalCache().centres;
  }
}

/**
 * Update centre details and contact user details in Airtable.
 */
export async function updateCentreAndContact(
  centreId: string,
  centreData: Partial<Omit<CRMCentre, 'id' | 'contactName' | 'contactEmail' | 'contactUserId' | 'activityCount'>>,
  contactData: { nom?: string; email?: string }
): Promise<boolean> {
  if (!API_KEY || !BASE_ID) return false;

  try {
    // 1. Update Centre in Airtable
    const centreFields: Record<string, unknown> = {};
    if (centreData.nom !== undefined) centreFields.nom = centreData.nom;
    if (centreData.adreca !== undefined) centreFields.adreça = centreData.adreca;
    if (centreData.telefon !== undefined) centreFields.telefon = centreData.telefon;
    if (centreData.email !== undefined) centreFields.email = centreData.email;
    if (centreData.web !== undefined) centreFields.web = centreData.web;
    if (centreData.barri !== undefined) {
      const poblacioId = centreData.barri ? await getPoblacioRecordIdByName(centreData.barri) : null;
      centreFields.poblacio = poblacioId ? [poblacioId] : [];
    }
    if (centreData.descripcio !== undefined) centreFields.descripcio = centreData.descripcio;

    if (Object.keys(centreFields).length > 0) {
      await fetchFromAirtable('Centres', {
        method: 'PATCH',
        body: JSON.stringify({
          records: [{ id: centreId, fields: centreFields }]
        })
      });
    }

    // 2. Fetch/Update linked User contact record
    if (contactData.nom !== undefined || contactData.email !== undefined) {
      // Find existing user linked to this centre
      const users = await fetchAllRecords('Usuaris_Centres', `{Centre}="${centreId}"`);
      
      if (users.length > 0) {
        // Update existing contact user record
        const userId = users[0].id;
        const userFields: Record<string, unknown> = {};
        if (contactData.nom !== undefined) userFields.Nom = contactData.nom;
        if (contactData.email !== undefined) userFields.Email = contactData.email;

        await fetchFromAirtable('Usuaris_Centres', {
          method: 'PATCH',
          body: JSON.stringify({
            records: [{ id: userId, fields: userFields }]
          })
        });
      } else {
        // Create new contact user record (with random placeholder password)
        const salt = bcrypt.genSaltSync(10);
        const placeholderPasswordHash = bcrypt.hashSync('GironaXicsCRM_' + Math.random().toString(36).substring(2, 10), salt);

        const newUserFields = {
          Nom: contactData.nom || 'Persona de Contacte',
          Email: (contactData.email || '').toLowerCase().trim(),
          PasswordHash: placeholderPasswordHash,
          Centre: [centreId],
          Aprovat: true
        };

        await fetchFromAirtable('Usuaris_Centres', {
          method: 'POST',
          body: JSON.stringify({ fields: newUserFields })
        });
      }
    }

    return true;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CRM] Error updating centre and contact:', errorMsg);
    throw err;
  }
}

/**
 * Fetch all activities belonging to a specific centre.
 */
export async function getActivitiesByCentre(centreId: string, centreNom: string): Promise<CRMActivity[]> {
  if (!API_KEY || !BASE_ID) return [];

  try {
    // Escaping quotes for Airtable formula
    const safeNom = centreNom.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const filter = `{centre}="${safeNom}"`;
    const records = await fetchAllRecords('Activitats', filter);

    return records.map(r => ({
      id: r.id,
      nom: (r.fields.nom as string) || '',
      slug: (r.fields.slug as string) || '',
      centreId: centreId,
      centreNom: centreNom,
      barri: Array.isArray(r.fields.barri) ? (r.fields.barri[0] as string) || '' : (r.fields.barri as string) || '',
      categoria: (r.fields.categoria as string) || '',
      edat: (r.fields.edat as string) || '',
      preu: (r.fields.preu as number | string) || 0,
      horari: (r.fields.horari as string) || '',
      dies: (r.fields.dies as string) || '',
      descripcio: (r.fields.descripcio as string) || '',
      publicada: !!r.fields.publicada,
      destacada: !!r.fields.destacada,
      poblacio_propia: Array.isArray(r.fields.nom_poblacio_propia) ? (r.fields.nom_poblacio_propia[0] as string) || '' : (r.fields.nom_poblacio_propia as string) || '',
      tipus: (r.fields.tipus as string) || "Extraescolar"
    }));
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CRM] Error fetching activities for centre ${centreNom}:`, errorMsg);
    return [];
  }
}

/**
 * Create a new centre and its contact user.
 */
export async function createCentreWithContact(
  nom: string,
  centreData: { adreca?: string; telefon?: string; email?: string; web?: string; barri?: string; descripcio?: string },
  contactData: { nom?: string; email?: string }
): Promise<CRMCentre | null> {
  if (!API_KEY || !BASE_ID) return null;

  try {
    // 1. Create Centre in Airtable
    const slug = nom.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const poblacioId = centreData.barri ? await getPoblacioRecordIdByName(centreData.barri) : null;

    const fields = {
      nom,
      slug,
      adreça: centreData.adreca || '',
      telefon: centreData.telefon || '',
      email: centreData.email || '',
      web: centreData.web || '',
      poblacio: poblacioId ? [poblacioId] : [],
      descripcio: centreData.descripcio || '',
    };

    const res = (await fetchFromAirtable('Centres', {
      method: 'POST',
      body: JSON.stringify({ fields })
    })) as { id: string };

    if (!res || !res.id) return null;

    const newCentreId = res.id;

    // 2. Create linked User contact record
    let contactUserId = undefined;
    if (contactData.nom || contactData.email) {
      const salt = bcrypt.genSaltSync(10);
      const placeholderPasswordHash = bcrypt.hashSync('GironaXicsCRM_' + Math.random().toString(36).substring(2, 10), salt);

      const newUserFields = {
        Nom: contactData.nom || 'Persona de Contacte',
        Email: (contactData.email || '').toLowerCase().trim(),
        PasswordHash: placeholderPasswordHash,
        Centre: [newCentreId],
        Aprovat: true
      };

      const userRes = (await fetchFromAirtable('Usuaris_Centres', {
        method: 'POST',
        body: JSON.stringify({ fields: newUserFields })
      })) as { id: string };
      if (userRes) {
        contactUserId = userRes.id;
      }
    }

    return {
      id: newCentreId,
      nom,
      adreca: centreData.adreca || '',
      telefon: centreData.telefon || '',
      email: centreData.email || '',
      web: centreData.web || '',
      barri: centreData.barri || '',
      descripcio: centreData.descripcio || '',
      contactName: contactData.nom || '',
      contactEmail: contactData.email || '',
      contactUserId,
      activityCount: 0
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CRM] Error creating centre and contact:', errorMsg);
    throw err;
  }
}
