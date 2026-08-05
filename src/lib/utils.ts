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

/**
 * Safely stringify JSON-LD data to prevent XSS when rendering inside a <script> tag.
 * Replaces '<' and '>' with unicode escape sequences.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
}

/**
 * Formata de manera intel·ligent el preu de l'activitat.
 * - Si és un número pur o cadena numèrica (ex: 50, "45.50"): li afegeix "€/mes".
 * - Si ja té indicador de període o text personalitzat (ex: "120/trimestre", "Gratuït"): ho formata adequadament.
 */
export function formatPreu(preu: number | string | undefined): string {
  if (preu === undefined || preu === null || String(preu).trim() === '') {
    return 'A consultar';
  }

  const preuStr = String(preu).trim();

  // Si és purament numèric (només dígits, espais, punts o comes)
  const isNumeric = /^[0-9\s.,]+$/.test(preuStr);
  if (isNumeric) {
    return `${preuStr}€/mes`;
  }

  // Si no conté el símbol € i comença per número, li afegim
  if (!preuStr.includes('€') && /^[0-9]/.test(preuStr)) {
    // Si conté una barra, ex: "50/trimestre" o "50/any"
    if (preuStr.includes('/')) {
      const parts = preuStr.split('/');
      const valor = parts[0].trim();
      const unitat = parts.slice(1).join('/').trim();
      return `${valor}€/${unitat}`;
    }
    return `${preuStr}€`;
  }

  return preuStr;
}

export interface MultiPreuItem {
  type: 'header' | 'option';
  text: string;
  concept?: string;
  price?: string;
}

/**
 * Parseja un text de preu multi-opció (amb | o salts de línia \n) en una llista d'ítems estructurats.
 */
export function parseMultiPreu(preuStr: string): MultiPreuItem[] {
  if (!preuStr) return [];
  const rawParts = preuStr.split(/[|\n]/).map(p => p.trim()).filter(Boolean);
  const items: MultiPreuItem[] = [];

  for (const part of rawParts) {
    // Si és una capçalera de secció (acaba amb : o conté paraules clau sense número/€)
    const isHeader = part.endsWith(':') || 
      (!part.includes('€') && !/\d/.test(part) && (
        part.toLowerCase().includes('quota') || 
        part.toLowerCase().includes('matricula') || 
        part.toLowerCase().includes('tarifa')
      ));

    if (isHeader) {
      items.push({
        type: 'header',
        text: part.replace(/:$/, '').trim(),
      });
      continue;
    }

    // Si conté dos punts separant concepte i preu (ex: "1 dia per setmana: 45 €")
    if (part.includes(':')) {
      const colonIdx = part.indexOf(':');
      const left = part.substring(0, colonIdx).trim();
      const right = part.substring(colonIdx + 1).trim();
      if (right.includes('€') || /\d/.test(right)) {
        items.push({
          type: 'option',
          text: part,
          concept: left,
          price: right,
        });
        continue;
      }
    }

    // Cerca d'un preu al final del text (ex: "1d/set (1.5h) 55 €/mes" o "1d/set (1.5h) 55 €")
    const priceMatch = part.match(/^(.*?)(?:\s+)?(\b\d+(?:[.,]\d+)?\s*(?:€|\/mes|\/trimestre|\/any|€\/[a-z\u00C0-\u024F]+)(?:\/[a-z\u00C0-\u024F]+)?)$/i);
    if (priceMatch && priceMatch[1].trim()) {
      items.push({
        type: 'option',
        text: part,
        concept: priceMatch[1].trim(),
        price: priceMatch[2].trim(),
      });
    } else {
      items.push({
        type: 'option',
        text: part,
        concept: part,
        price: '',
      });
    }
  }

  return items;
}

/**
 * Mapeja errors tècnics o codis de resposta d'Airtable/xarxa a missatges clars i entenedors en català.
 */
export function mapAirtableError(err: unknown): string {
  if (!err) return "S'ha produït un error desconegut.";
  
  let msg = "";
  if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === "string") {
    msg = err;
  } else {
    msg = JSON.stringify(err);
  }

  const lower = msg.toLowerCase();

  // SSL and network errors
  if (lower.includes("unable_to_verify_leaf_signature") || lower.includes("leaf signature") || lower.includes("ssl")) {
    return "Error de connexió SSL segura amb la base de dades. Si us plau, comprova que la configuració sigui correcta.";
  }
  
  if (lower.includes("fetch failed") || lower.includes("enotfound") || lower.includes("econnrefused")) {
    return "No s'ha pogut establir connexió amb el servidor. Comprova que tinguis connexió activa a internet.";
  }

  if (lower.includes("invalid_value_for_column") || lower.includes("invalid cell value") || lower.includes("cell value")) {
    return "Hi ha un valor no admès o de format incorrecte en algun camp. Si us plau, revisa les dades.";
  }

  if (lower.includes("not_found") || lower.includes("record_not_found") || lower.includes("does not exist") || lower.includes("not found")) {
    return "No s'ha trobat el registre especificat. És possible que hagi estat eliminat.";
  }

  if (lower.includes("unauthorized") || lower.includes("authentication_required") || lower.includes("401")) {
    return "Error de credencials de base de dades. Si us plau, revisa la configuració local (.env.local).";
  }

  if (lower.includes("request_too_large") || lower.includes("413") || lower.includes("too large")) {
    return "La mida de la petició supera el límit (màxim 4MB per imatge).";
  }

  // General fallback
  return `Error de la base de dades: ${msg}`;
}

/**
 * Obté o crea una llavor aleatòria única per a la sessió de navegació de l'usuari (sessionStorage).
 * Aquesta llavor es manté 100% igual durant tota la visita/sessió de l'usuari (mentre navega,
 * obre fitxes de centres i torna enrere). En una nova sessió/pestanya, es genera una nova llavor.
 */
export function getSessionRandomSeed(): string {
  if (typeof window === 'undefined') return '';
  try {
    let seed = sessionStorage.getItem('gironaxics_session_seed');
    if (!seed) {
      seed = Math.random().toString(36).substring(2);
      sessionStorage.setItem('gironaxics_session_seed', seed);
    }
    return seed;
  } catch {
    return 'fallback';
  }
}

/**
 * Calcula un pes/hash determinista entre 0 i 1 basat en una clau i la llavor de sessió de l'usuari.
 */
export function getDeterministicSeed(str: string, sessionSeed = ''): number {
  const combined = str + sessionSeed;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}




