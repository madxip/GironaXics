export interface Activitat {
  id?: string;
  slug: string;
  nom: string;
  centre: string; // The text name or ID
  centreId?: string; // The record ID of the center
  barri: string;
  categoria: string;
  categories?: string[];
  edat: string;
  preu?: number | string;
  destacada: boolean;
  centreInteressat?: boolean; // Centre ha confirmat participació
  destacada_gran?: boolean;
  horari: string;
  dies: string;
  descripcio: string;
  durada: string;
  alumnes: string;
  material: string;
  inici: string;
  idioma: string;
  qui_imparteix?: string;
  publicada: boolean;
  imatgeUrl?: string;
  imatgeThumbnailUrl?: string;
  galeria?: string[];
  centreImatgeUrl?: string;
  subcategoria?: string;
  tipus?: string; // Extraescolar, Casal, Taller / Oci
  torns?: string; // Torns del casal (una línia per torn: "DD/M/AA-DD/M/AA")
  centreVacances?: string; // Vacances del centre (una línia per rang: "DD/MM/AA-DD/MM/AA")
  rawImatgeUrl?: string;
  rawImatgeThumbnailUrl?: string;
  rawGaleria?: string[];
  poblacio_propia?: string;
  adreca_propia?: string;
  nee?: boolean;
}

export interface Sponsor {
  id: string;
  nom: string;
  categoriaSlug: string;
  imatgeUrl: string;
  enllac: string;
  actiu: boolean;
  descripcio?: string;
  imatgeFonsUrl?: string;
  imatgeFonsMobilUrl?: string;
  titol?: string;
  rawImatgeUrl?: string;
  rawImatgeFonsUrl?: string;
  posicioFons?: string;
}

export interface Centre {
  id?: string;
  slug: string;
  nom: string;
  adreca: string;
  telefon: string;
  email: string;
  web: string;
  barri: string;
  descripcio: string;
  imatgeUrl?: string;
  interessat?: boolean; // Centre ha confirmat participació (casella Airtable)
  vacances?: string; // Rangs de vacances (una línia per rang: "DD/MM/AA-DD/MM/AA")
  rawImatgeUrl?: string;
}

export interface CasalsBanner {
  id: string;
  nom: string;
  actiu: boolean;
  kicker?: string;
  titol?: string;
  subtitol?: string;
  dates?: string;
  dataLimit?: string;
  dataInici?: string;
  dataFi?: string;
}

export interface PoblacioRecord {
  nom: string;
  comarca: string;
}


