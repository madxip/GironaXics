export interface Activitat {
  id?: string;
  slug: string;
  nom: string;
  centre: string; // The text name or ID
  centreId?: string; // The record ID of the center
  barri: string;
  categoria: string;
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
  galeria?: string[];
  centreImatgeUrl?: string;
  subcategoria?: string;
  tipus?: string; // Extraescolar, Casal, Taller / Oci
}

export interface Sponsor {
  id: string;
  nom: string;
  categoriaSlug: string;
  imatgeUrl: string;
  enllac: string;
  actiu: boolean;
  descripcio?: string;
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
}

