import React from "react";
import { getActivitats } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import ActivityForm from "../ActivityForm";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  "Arts plàstiques",
  "Creativitat i Expressió",
  "Cuina",
  "Dansa",
  "Escacs",
  "Esports",
  "Idiomes",
  "Ioga",
  "Música",
  "Naturalesa",
  "Programació i robòtica",
  "Salut i benestar",
  "Teatre"
];

const DEFAULT_BARRIS = [
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
  "Salt",
  "Sant Daniel",
  "Sant Narcís",
  "Santa Eugènia",
  "Vila-roja i Font de la Pólvora",
  "Vista Alegre - Carme"
];

export default async function NovaActivitatPage() {
  const activitats = await getActivitats();
  
  // Dynamically build list of categories and barris, merging with standard defaults
  const categories = Array.from(new Set([
    ...activitats.map(a => a.categoria?.trim()).filter(Boolean),
    ...DEFAULT_CATEGORIES.map(c => c.trim())
  ])).sort();

  const barris = Array.from(new Set([
    ...activitats.map(a => a.barri?.trim()).filter(Boolean),
    ...DEFAULT_BARRIS.map(b => b.trim())
  ])).sort();

  return (
    <ActivityForm
      categories={categories}
      barris={barris}
      submitAction={createActivitatAction}
      title="Nova Activitat Extraescolar"
    />
  );
}
