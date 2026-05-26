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


