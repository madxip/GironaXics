import { getActivitats, getCentres, getPoblacions, getSubcategories } from "@/lib/airtable";
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

export default async function NovaActivitatPage({ searchParams }: { searchParams: { centreId?: string; duplicateFrom?: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const isAdmin = !!session.user.isAdmin;
  const [activitats, allCentres, allPoblacions, subcategories] = await Promise.all([
    getActivitats(),
    getCentres(),
    getPoblacions(),
    getSubcategories(),
  ]);
  const centre = allCentres.find(c => c.id === session.user.centreId);
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

  // Processament de la duplicació si existeix duplicateFrom
  let duplicateData = undefined;
  if (searchParams.duplicateFrom) {
    const original = activitats.find(a => a.id === searchParams.duplicateFrom);
    if (original) {
      // Seguretat: Si no és admin, només pot duplicar activitats del seu propi centre
      if (isAdmin || original.centreId === session.user.centreId) {
        duplicateData = {
          ...original,
          id: undefined, // Traiem la ID perquè sigui una creació neta
          slug: undefined, // Traiem el slug perquè se'n generi un de nou
        };
      }
    }
  }

  return (
    <ActivityForm
      initialData={duplicateData}
      categories={categories}
      subcategories={subcategories}
      submitAction={createActivitatAction}
      title={duplicateData ? `Duplicar Activitat: ${duplicateData.nom}` : "Nova Activitat Extraescolar"}
      centre={centre}
      allCentres={isAdmin ? allCentres : undefined}
      isAdmin={isAdmin}
      poblacions={poblacionsGrouped}
      initialCentreId={duplicateData ? duplicateData.centreId : searchParams.centreId}
    />
  );
}
