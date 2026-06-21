/**
 * Llista oficial de barris de Girona.
 * S'usa als formularis del dashboard i al filtre públic.
 *
 * Qualsevol barri que no estigui en aquesta llista es considera
 * "Altres poblacions" i s'agrupa automàticament al selector.
 */

export const BARRIS_GIRONA: string[] = [
  "Barri Vell",
  "Centre",
  "Devesa",
  "Domeny - Fontajau",
  "Eixample",
  "Fontajau",
  "Germans Sàbat",
  "Germans Sàbat - Taialà",
  "Mas Xirgu",
  "Montilivi",
  "Montilivi - Palau",
  "Palau",
  "Pedret",
  "Pont Major",
  "Sant Daniel",
  "Sant Narcís",
  "Santa Eugènia",
  "Taialà",
  "Vila-roja i Font de la Pólvora",
  "Vista Alegre - Carme",
];

/** Set per a consultes O(1) — qualsevol barri absent d'aquí és "Altres poblacions" */
export const BARRIS_GIRONA_SET = new Set<string>(BARRIS_GIRONA);
