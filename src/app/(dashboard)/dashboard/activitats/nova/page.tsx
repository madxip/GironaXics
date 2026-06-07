import { getActivitats, getCentres } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityForm from "../ActivityForm";
import { BARRIS_GIRONA, BARRIS_GIRONA_SET } from "@/lib/barris";


export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
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
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const isAdmin = !!session.user.isAdmin;
  const activitats = await getActivitats();
  const allCentres = await getCentres();
  const centre = allCentres.find(c => c.id === session.user.centreId);

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
      centre={centre}
      allCentres={isAdmin ? allCentres : undefined}
      isAdmin={isAdmin}
    />
  );
}
