import { getActivitats, getCentres } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityForm from "../ActivityForm";
import { BARRIS_GIRONA, BARRIS_SALT } from "@/lib/barris";


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

  const activitats = await getActivitats();
  const allCentres = await getCentres();
  const centre = allCentres.find(c => c.id === session.user.centreId);

  // Dynamically build list of categories and barris, merging with standard defaults
  const categories = Array.from(new Set([
    ...activitats.map(a => a.categoria?.trim()).filter(Boolean),
    ...DEFAULT_CATEGORIES.map(c => c.trim())
  ])).sort();

  // Barris de Girona (excloent Salt) + els que surtin a les activitats
  const barrisGirona = Array.from(new Set([
    ...activitats.map(a => a.barri?.trim()).filter((b): b is string => !!b && b !== 'Salt'),
    ...BARRIS_GIRONA
  ])).sort();
  const barris = { girona: barrisGirona, salt: BARRIS_SALT };

  return (
    <ActivityForm
      categories={categories}
      barris={barris}
      submitAction={createActivitatAction}
      title="Nova Activitat Extraescolar"
      centre={centre}
    />
  );
}
