import React from "react";
import { getActivitats } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import ActivityForm from "../ActivityForm";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  "Arts plàstiques",
  "Dansa i Teatre",
  "Esports",
  "Idiomes",
  "Música",
  "Reforç escolar",
  "Tecnologia i Ciència"
];

const DEFAULT_BARRIS = [
  "Barri Vell",
  "Carme",
  "Centre",
  "Devesa-Güell",
  "Eixample",
  "Fontajau",
  "Girona Est",
  "Montilivi",
  "Montjuïc",
  "Pedret",
  "Pont Major",
  "Santa Eugènia",
  "Sant Narcís",
  "Taialà"
];

export default async function NovaActivitatPage() {
  const activitats = await getActivitats();
  
  // Dynamically build list of categories and barris, merging with standard defaults
  const categories = Array.from(new Set([
    ...activitats.map(a => a.categoria).filter(Boolean),
    ...DEFAULT_CATEGORIES
  ])).sort();

  const barris = Array.from(new Set([
    ...activitats.map(a => a.barri).filter(Boolean),
    ...DEFAULT_BARRIS
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
