import React from "react";
import { getActivitats } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import ActivityForm from "../ActivityForm";
import { BARRIS_GIRONA, BARRIS_GIRONA_SET } from "@/lib/barris";

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

export default async function NovaActivitatPage() {
  const activitats = await getActivitats();
  
  // Dynamically build list of categories and barris, merging with standard defaults
  const categories = Array.from(new Set([
    ...activitats.map(a => a.categoria?.trim()).filter(Boolean),
    ...DEFAULT_CATEGORIES.map(c => c.trim())
  ])).sort();

  // Barris de Girona (llista fixa) + Altres poblacions (qualsevol barri no reconegut)
  const altresBarris = Array.from(new Set(
    activitats.map(a => a.barri?.trim()).filter((b): b is string => !!b && !BARRIS_GIRONA_SET.has(b))
  )).sort();
  const barris = { girona: BARRIS_GIRONA, altres: altresBarris };

  return (
    <ActivityForm
      categories={categories}
      barris={barris}
      submitAction={createActivitatAction}
      title="Nova Activitat Extraescolar"
    />
  );
}
