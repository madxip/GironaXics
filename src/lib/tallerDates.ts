/**
 * Utilitat per parsejar i gestionar dates de tallers des del camp `dies`
 * en format text català (ex: "Dissabte, 20 de juny de 2026")
 */

const CATALAN_MONTHS = [
  "gener", "febrer", "març", "abril", "maig", "juny",
  "juliol", "agost", "setembre", "octubre", "novembre", "desembre"
];

// ─── TALLERS PUNTUALS ────────────────────────────────────────────────────────

/**
 * Parseja totes les dates d'un text en català del camp `dies` (tallers puntuals).
 * Exemples:
 *  - "Dissabte, 20 de juny de 2026"              → [Date(2026-06-20)]
 *  - "20, 21 i 22 de juny de 2026"               → [Date(2026-06-20), …]
 *  - "20 de juny de 2026 i 5 de juliol de 2026"  → [Date(2026-06-20), Date(2026-07-05)]
 *  - "Cada dimarts"                               → [] (recurrent, sense dates fixes)
 */
export function parseTallerDates(dies: string): Date[] {
  if (!dies) return [];
  const lower = dies.toLowerCase();

  // Tallers recurrents no tenen dates concretes al primer tros
  if (lower.startsWith("cada")) return [];

  // Si no hi ha cap nom de mes → és un patró sense dates fixes
  if (!CATALAN_MONTHS.some(m => lower.includes(m))) return [];

  const results: Date[] = [];
  let remaining = lower;

  for (let mi = 0; mi < CATALAN_MONTHS.length; mi++) {
    const monthName = CATALAN_MONTHS[mi];
    const pos = remaining.indexOf(monthName);
    if (pos === -1) continue;

    // Any: busquem el primer any de 4 dígits que aparegui DESPRÉS del mes
    const afterMonth = remaining.substring(pos + monthName.length);
    const yearAfterMatch = afterMonth.match(/\b(20\d{2})\b/);
    const yearFallbackMatch = lower.match(/\b(20\d{2})\b/);
    const year = yearAfterMatch
      ? parseInt(yearAfterMatch[1])
      : yearFallbackMatch
        ? parseInt(yearFallbackMatch[1])
        : new Date().getFullYear();

    // Dies: tots els números d'1 o 2 dígits que apareguin ABANS del mes
    const beforeMonth = remaining.substring(0, pos);
    const dayMatches = Array.from(beforeMonth.matchAll(/\b(\d{1,2})\b/g));

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
 * Retorna la propera data vigent (avui o futura) d'entre totes les dates.
 * Retorna null si totes han passat.
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
 * Retorna true si el taller puntual té dates i totes han passat.
 */
export function isTallerExpired(dies: string): boolean {
  const dates = parseTallerDates(dies);
  if (dates.length === 0) return false;
  return getNextUpcomingTallerDate(dates) === null;
}

// ─── TALLERS RECURRENTS ──────────────────────────────────────────────────────

/**
 * Parseja les dates d'inici i fi del camp `dies` d'un taller recurrent.
 * Format esperat: "Cada dimarts. Del 3 de setembre de 2025 al 20 de juny de 2026"
 * o: "Cada dimarts. A partir del 3 de setembre de 2026"
 * Retorna { start: Date | null, end: Date | null }
 */
export function parseTallerRecurrentRange(dies: string): { start: Date | null; end: Date | null } {
  if (!dies || !dies.toLowerCase().startsWith("cada")) return { start: null, end: null };

  const dotIdx = dies.indexOf(". ");
  if (dotIdx === -1) return { start: null, end: null };

  const rangePart = dies.substring(dotIdx + 2);
  const lower = rangePart.toLowerCase();
  const allYears = Array.from(rangePart.matchAll(/\b(20\d{2})\b/g)).map(m => parseInt(m[1]));
  const alIdx = lower.indexOf(" al ");

  if (alIdx === -1) {
    // "A partir del X de MES de YYYY"
    const year = allYears[0] || new Date().getFullYear();
    let mIdx = -1;
    for (let i = 0; i < CATALAN_MONTHS.length; i++) {
      if (lower.includes(CATALAN_MONTHS[i])) { mIdx = i; break; }
    }
    const dayM = lower.match(/\b(\d{1,2})\b/);
    if (mIdx !== -1 && dayM) {
      const d = new Date(year, mIdx, parseInt(dayM[1]));
      return { start: isNaN(d.getTime()) ? null : d, end: null };
    }
    return { start: null, end: null };
  }

  const startPart = lower.substring(0, alIdx);
  const endPart   = lower.substring(alIdx + 4);

  let startMIdx = -1;
  for (let i = 0; i < CATALAN_MONTHS.length; i++) {
    if (startPart.includes(CATALAN_MONTHS[i])) { startMIdx = i; break; }
  }
  let endMIdx = -1;
  for (let i = 0; i < CATALAN_MONTHS.length; i++) {
    if (endPart.includes(CATALAN_MONTHS[i])) { endMIdx = i; break; }
  }

  const startDayM  = startPart.match(/\b(\d{1,2})\b/);
  const endDayM    = endPart.match(/\b(\d{1,2})\b/);
  const startYearM = startPart.match(/\b(20\d{2})\b/);
  const endYearM   = endPart.match(/\b(20\d{2})\b/);
  const startYear  = startYearM ? parseInt(startYearM[1]) : (allYears[0] || new Date().getFullYear());
  const endYear    = endYearM   ? parseInt(endYearM[1])   : (allYears[allYears.length - 1] || new Date().getFullYear());

  const start = (startMIdx !== -1 && startDayM)
    ? new Date(startYear, startMIdx, parseInt(startDayM[1])) : null;
  const end   = (endMIdx   !== -1 && endDayM)
    ? new Date(endYear,   endMIdx,   parseInt(endDayM[1]))   : null;

  return {
    start: start && !isNaN(start.getTime()) ? start : null,
    end:   end   && !isNaN(end.getTime())   ? end   : null,
  };
}

/**
 * Retorna true si el taller recurrent té una data de fi que ja ha passat.
 */
export function isRecurrentTallerExpired(dies: string): boolean {
  const { end } = parseTallerRecurrentRange(dies);
  if (!end) return false; // Sense data de fi → no expira mai
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

// ─── FUNCIONS UNIFICADES (puntual + recurrent) ───────────────────────────────

/**
 * Retorna la propera data rellevant de qualsevol tipus de taller:
 * - Puntual:   la pròxima data vigent
 * - Recurrent: la data d'inici configurada (o null si no n'hi ha)
 */
export function getNextTallerDate(dies: string): Date | null {
  if (!dies) return null;
  if (dies.toLowerCase().startsWith("cada")) {
    return parseTallerRecurrentRange(dies).start;
  }
  return getNextUpcomingTallerDate(parseTallerDates(dies));
}

/**
 * Retorna true si el taller (puntual o recurrent) s'ha acabat i s'ha d'amagar.
 */
export function isTallerExpiredOrEnded(dies: string): boolean {
  if (!dies) return false;
  if (dies.toLowerCase().startsWith("cada")) {
    return isRecurrentTallerExpired(dies);
  }
  return isTallerExpired(dies);
}
