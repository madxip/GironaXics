"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateCentre, getCentres } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

async function getAuthenticatedCentreId() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.centreId) {
    throw new Error("Sessió no autoritzada.");
  }
  return session.user.centreId;
}

export async function updateCentreAction(prevState: unknown, formData: FormData) {
  try {
    const centreId = await getAuthenticatedCentreId();
    
    const nom = formData.get("nom") as string;
    const adreca = formData.get("adreca") as string;
    const telefon = formData.get("telefon") as string;
    const email = formData.get("email") as string;
    const web = formData.get("web") as string;
    const barri = formData.get("barri") as string;
    const descripcio = formData.get("descripcio") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;

    if (!nom || !barri) {
      return { success: false, error: "Si us plau, omple els camps obligatoris (Nom del Centre i Barri de Girona)." };
    }

    const success = await updateCentre(centreId, {
      nom,
      adreca: adreca || "",
      telefon: telefon || "",
      email: email || "",
      web: web || "",
      barri: barri || "",
      descripcio: descripcio || "",
      imatgeUrl: imatgeUrl || ""
    });

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar el perfil del centre a Airtable." };
    }

    // Get current slug to purge the specific center path cache
    const centres = await getCentres();
    const currentCentre = centres.find(c => c.id === centreId);
    if (currentCentre) {
      revalidatePath(`/centres/${currentCentre.slug}`);
    }

    // Purge other active pages
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/centre");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[Update Centre Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}
