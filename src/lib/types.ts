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
}

