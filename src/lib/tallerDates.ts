/**
 * Utilitat per parsejar i gestionar dates de tallers des del camp `dies`
 * en format text català (ex: "Dissabte, 20 de juny de 2026")
 */

const CATALAN_MONTHS = [
  "gener", "febrer", "març", "abril", "maig", "juny",
  "juliol", "agost", "setembre", "octubre", "novembre", "desembre"
];

/**
 * Parseja totes les dates d'un text en català del camp `dies`.
 * Exemples d'entrada:
 *  - "Dissabte, 20 de juny de 2026"           → [Date(2026-06-20)]
 *  - "20, 21 i 22 de juny de 2026"            → [Date(2026-06-20), Date(2026-06-21), Date(2026-06-22)]
 *  - "20 de juny de 2026 i 5 de juliol de 2026" → [Date(2026-06-20), Date(2026-07-05)]
 *  - "Cada dimarts"                            → [] (recurrent, sense dates fixes)
 */
export function parseTallerDates(dies: string): Date[] {
  if (!dies) return [];
  const lower = dies.toLowerCase();

  // Si no hi ha cap nom de mes → és un patró recurrent (sense dates concretes)
  if (!CATALAN_MONTHS.some(m => lower.includes(m))) return [];

  const results: Date[] = [];

  // Treballem sobre còpies que anem truncant a mesura que consumim mesos
  let remaining = lower;

  for (let mi = 0; mi < CATALAN_MONTHS.length; mi++) {
    const monthName = CATALAN_MONTHS[mi];
    const pos = remaining.indexOf(monthName);
    if (pos === -1) continue;

    // Any: busquem el primer any de 4 dígits que aparegui DESPRÉS del mes
    const afterMonth = remaining.substring(pos + monthName.length);
    const yearAfterMatch = afterMonth.match(/\b(20\d{2})\b/);
    // Si no n'hi ha al darrere, usem el que hi hagi a la cadena original
    const yearFallbackMatch = lower.match(/\b(20\d{2})\b/);
    const year = yearAfterMatch
      ? parseInt(yearAfterMatch[1])
      : yearFallbackMatch
        ? parseInt(yearFallbackMatch[1])
        : new Date().getFullYear();

    // Dies: tots els números d'1 o 2 dígits que apareguin ABANS del mes
    const beforeMonth = remaining.substring(0, pos);
    const dayMatches = [...beforeMonth.matchAll(/\b(\d{1,2})\b/g)];

    for (const dm of dayMatches) {
      const day = parseInt(dm[1]);
      if (day >= 1 && day <= 31) {
        const d = new Date(year, mi, day);
        if (!isNaN(d.getTime())) results.push(d);
      }
    }

    // Consumim fins al final del mes per no reutilitzar-lo
    remaining = remaining.substring(pos + monthName.length);
  }

  return results;
}

/**
 * Retorna la propera data vigent (avui o futura) d'entre totes les dates
 * del taller. Retorna null si totes han passat.
 */
export function getNextUpcomingTallerDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = dates
    .filter(d => d >= today)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming.length > 0 ? upcoming[0] : null;
}

/**
 * Retorna true si el taller té dates concretes i totes han passat
 * (l'activitat s'ha d'amagar del llistat).
 */
export function isTallerExpired(dies: string): boolean {
  const dates = parseTallerDates(dies);
  // Si no té dates concretes (recurrent), no s'amaga mai
  if (dates.length === 0) return false;
  return getNextUpcomingTallerDate(dates) === null;
}
