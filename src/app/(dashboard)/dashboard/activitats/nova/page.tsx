import { getActivitats, getCentres, getPoblacions } from "@/lib/airtable";
import { createActivitatAction } from "@/app/actions/activitats";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityForm from "../ActivityForm";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  "Creativitat i Expressió",
  "Cuina",
  "Dansa",
  "En Família",
  "Escacs",
  "Esports",
  "Idiomes",
  "Ioga",
  "Lleure",
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

  // Carrega totes les poblacions i les agrupa per comarca
  const allPoblacions = await getPoblacions();
  const poblacionsGrouped: Record<string, string[]> = {};

  allPoblacions.forEach(p => {
    if (p.comarca && p.nom) {
      if (!poblacionsGrouped[p.comarca]) {
        poblacionsGrouped[p.comarca] = [];
      }
      poblacionsGrouped[p.comarca].push(p.nom);
    }
  });

  // Dynamically build list of categories and barris, merging with standard defaults
  const categories = Array.from(new Set([
    ...activitats.map(a => a.categoria?.trim()).filter(Boolean),
    ...DEFAULT_CATEGORIES.map(c => c.trim())
  ])).sort();

  return (
    <ActivityForm
      categories={categories}
      submitAction={createActivitatAction}
      title="Nova Activitat Extraescolar"
      centre={centre}
      allCentres={isAdmin ? allCentres : undefined}
      isAdmin={isAdmin}
      poblacions={poblacionsGrouped}
    />
  );
}
