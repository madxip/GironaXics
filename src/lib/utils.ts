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
