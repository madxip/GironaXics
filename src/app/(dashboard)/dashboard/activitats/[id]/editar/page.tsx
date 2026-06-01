import { getActivitats, getCentres } from "@/lib/airtable";
import { updateActivitatAction } from "@/app/actions/activitats";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivityForm from "../../ActivityForm";

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

interface EditarActivitatPageProps {
  params: {
    id: string;
  };
}

export default async function EditarActivitatPage({ params }: EditarActivitatPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const { id } = params;
  const allActivitats = await getActivitats();
  const activitat = allActivitats.find(a => a.id === id);

  // Security check: Verify that the activity exists and belongs to the connected center
  if (!activitat) {
    return (
      <div style={{
        padding: "40px",
        backgroundColor: "#FCE8E6",
        border: "1px solid #F5C2C2",
        color: "#C53929",
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Activitat no trobada</h3>
        <p>No s'ha trobat cap activitat amb aquest identificador.</p>
      </div>
    );
  }

  if (activitat.centreId !== session.user.centreId) {
    return (
      <div style={{
        padding: "40px",
        backgroundColor: "#FCE8E6",
        border: "1px solid #F5C2C2",
        color: "#C53929",
        borderRadius: "8px",
        textAlign: "center"
      }}>
        <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>Accés No Autoritzat</h3>
        <p>No tens permisos per gestionar o editar aquesta activitat.</p>
      </div>
    );
  }

  const allCentres = await getCentres();
  const centre = allCentres.find(c => c.id === session.user.centreId || c.nom === activitat.centre);

  // Build options
  const categories = Array.from(new Set([
    ...allActivitats.map(a => a.categoria?.trim()).filter(Boolean),
    ...DEFAULT_CATEGORIES.map(c => c.trim())
  ])).sort();

  const barris = Array.from(new Set([
    ...allActivitats.map(a => a.barri?.trim()).filter(Boolean),
    ...DEFAULT_BARRIS.map(b => b.trim())
  ])).sort();

  // Bind the ID to the server action so the form can just call it
  const boundUpdateAction = updateActivitatAction.bind(null, id);

  return (
    <ActivityForm
      initialData={activitat}
      categories={categories}
      barris={barris}
      submitAction={boundUpdateAction}
      title={`Editar Activitat: ${activitat.nom}`}
      centre={centre}
    />
  );
}
