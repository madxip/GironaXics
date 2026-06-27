"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateCentre, getCentres } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

async function getAuthenticatedCentreId(formData: FormData): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Sessió no autoritzada.");
  }
  // Admin can edit any centre — use the centreId sent from the form
  if (session.user.isAdmin) {
    const centreId = formData.get("centreId") as string;
    if (!centreId) throw new Error("Sessió no autoritzada.");
    return centreId;
  }
  // Regular centre user
  if (!session.user.centreId) {
    throw new Error("Sessió no autoritzada.");
  }
  return session.user.centreId;
}

export async function updateCentreAction(prevState: unknown, formData: FormData) {
  try {
    const centreId = await getAuthenticatedCentreId(formData);

    const nom = formData.get("nom") as string;
    const adreca = formData.get("adreca") as string;
    const telefon = formData.get("telefon") as string;
    const email = formData.get("email") as string;
    let web = formData.get("web") as string;
    if (web && web.trim() !== "") {
      web = web.trim();
      if (!/^https?:\/\//i.test(web)) {
        web = `https://${web}`;
      }
    }
    const barri = formData.get("barri") as string;
    const descripcio = formData.get("descripcio") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;
    const vacances = formData.get("vacances") as string;

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
      imatgeUrl: imatgeUrl || "",
      vacances: vacances || ""
    });

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar el perfil del centre a Airtable." };
    }

    // Get current slug to purge the specific center path cache
    const centres = await getCentres();
    const currentCentre = centres.find(c => c.id === centreId);
    if (currentCentre) {
      try {
        revalidatePath(`/centres/${currentCentre.slug}`);
      } catch (e) {
        console.error(`[Revalidate] Error revalidating '/centres/${currentCentre.slug}':`, e);
      }
    }

    // Purge other active pages
    try {
      revalidatePath("/");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/':", e);
    }
    try {
      revalidatePath("/dashboard");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/dashboard':", e);
    }
    try {
      revalidatePath("/dashboard/centre");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/dashboard/centre':", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[Update Centre Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}
