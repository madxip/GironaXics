"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateCentre as updateAirtableCentre, getCentres as getAirtableCentres, clearAllCache } from "@/lib/airtable";
import { updateDbCentre, getDbCentres, supabase } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";

async function getAuthenticatedCentreId(formData: FormData): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Sessió no autoritzada.");
  }
  if (session.user.isAdmin) {
    const centreId = formData.get("centreId") as string;
    if (!centreId) throw new Error("Sessió no autoritzada.");
    return centreId;
  }
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

    const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;
    const updateData = {
      nom,
      adreca: adreca || "",
      telefon: telefon || "",
      email: email || "",
      web: web || "",
      barri: barri || "",
      descripcio: descripcio || "",
      imatgeUrl: imatgeUrl || "",
      vacances: vacances || ""
    };

    const success = useDb 
      ? await updateDbCentre(centreId, updateData) 
      : await updateAirtableCentre(centreId, updateData);

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar el perfil del centre." };
    }

    if (!useDb) {
      clearAllCache(revalidateTag);
    }

    const centres = useDb ? await getDbCentres() : await getAirtableCentres();
    const currentCentre = centres.find(c => c.id === centreId);
    if (currentCentre) {
      try {
        revalidatePath(`/centres/${currentCentre.slug}`);
      } catch (e) {
        console.error(`[Revalidate] Error revalidating '/centres/${currentCentre.slug}':`, e);
      }
    }

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
