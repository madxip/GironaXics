/**
 * Llista oficial de barris de Girona i municipis veïns.
 * S'usa als formularis del dashboard i al filtre públic.
 *
 * Salt no és un barri de Girona — és un municipi independent
 * separat físicament per un carrer, però amb molta relació.
 * Per això es mostra separat al selector.
 */

export const BARRIS_GIRONA: string[] = [
  "Barri Vell",
  "Centre",
  "Devesa",
  "Eixample",
  "Fontajau",
  "Germans Sàbat",
  "Mas Xirgu",
  "Montilivi",
  "Palau",
  "Pedret",
  "Pont Major",
  "Sant Daniel",
  "Sant Narcís",
  "Santa Eugènia",
  "Vila-roja i Font de la Pólvora",
  "Vista Alegre - Carme",
];

export const BARRIS_SALT: string[] = [
  "Salt",
];

/** Tots els barris en un array pla (per compatibilitat amb filtres i kerques) */
export const ALL_BARRIS: string[] = [...BARRIS_GIRONA, ...BARRIS_SALT];
