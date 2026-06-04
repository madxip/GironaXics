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

  // SSL and network errors (e.g. Node fetch local certificate issues or lack of connection)
  if (lower.includes("unable_to_verify_leaf_signature") || lower.includes("leaf signature") || lower.includes("ssl")) {
    return "Error de connexió SSL segura amb la base de dades. Si us plau, comprova que la configuració de xarxa i el certificat siguin correctes.";
  }
  
  if (lower.includes("fetch failed") || lower.includes("enotfound") || lower.includes("econnrefused")) {
    return "No s'ha pogut establir connexió amb el servidor d'Airtable. Comprova que tinguis connexió activa a internet.";
  }

  // Schema & computed fields constraints
  if (lower.includes("computed") || lower.includes("cannot be modified") || lower.includes("computed field")) {
    return "No es pot desar el valor directament perquè la columna és un camp calculat o Lookup a Airtable. Si us plau, verifica el disseny de la base de dades.";
  }

  if (lower.includes("invalid_value_for_column") || lower.includes("invalid cell value") || lower.includes("cell value")) {
    return "Hi ha un valor no admès o de format incorrecte en algun camp. Si us plau, revisa les dades (com ara URLs d'imatge o relacions).";
  }

  if (lower.includes("not_found") || lower.includes("record_not_found") || lower.includes("does not exist") || lower.includes("not found")) {
    return "No s'ha trobat el registre especificat. És possible que hagi estat eliminat per un altre usuari.";
  }

  if (lower.includes("unauthorized") || lower.includes("authentication_required") || lower.includes("bearer") || lower.includes("401")) {
    return "Error de credencials de base de dades (API key incorrecta o caducada). Si us plau, revisa la configuració local (.env.local).";
  }

  if (lower.includes("table not found") || lower.includes("base not found") || lower.includes("404")) {
    return "No s'ha trobat la taula o la base de dades de destí a Airtable. Verifica que el BASE_ID i el nom siguin correctes.";
  }

  if (lower.includes("request_too_large") || lower.includes("413") || lower.includes("too large")) {
    return "La mida de la petició supera el límit. Assegura't que les fotos adjuntes no pesin massa (màxim 4MB).";
  }

  if (lower.includes("422")) {
    // Mostra el cos complet de l'error d'Airtable per facilitar el diagnòstic
    const body = msg.replace(/^Failed to (update|create|delete) \w+: 422 /, "");
    return `Error de validació Airtable 422: ${body}`;
  }

  // General fallback
  return `Error de la base de dades: ${msg}`;
}



