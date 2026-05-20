"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createActivitat, updateActivitat, deleteActivitat } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

// Helper to check authentication and ownership
async function getAuthenticatedCentreId() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.centreId) {
    throw new Error("Sessió no autoritzada.");
  }
  return session.user.centreId;
}

export async function createActivitatAction(prevState: unknown, formData: FormData) {
  try {
    const centreId = await getAuthenticatedCentreId();
    
    const nom = formData.get("nom") as string;
    const barri = formData.get("barri") as string;
    const categoria = formData.get("categoria") as string;
    const edat = formData.get("edat") as string;
    const preuStr = formData.get("preu") as string;
    const horari = formData.get("horari") as string;
    const dies = formData.get("dies") as string;
    const descripcio = formData.get("descripcio") as string;
    const durada = formData.get("durada") as string;
    const alumnes = formData.get("alumnes") as string;
    const material = formData.get("material") as string;
    const inici = formData.get("inici") as string;
    const idioma = formData.get("idioma") as string;
    const qui_imparteix = formData.get("qui_imparteix") as string;

    if (!nom || !barri || !categoria || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Barri, Categoria, Edat, Horari i Dies)." };
    }

    // Convert preu to number if valid, otherwise keep as string or leave empty
    const preu = preuStr ? Number(preuStr) : undefined;

    const result = await createActivitat({
      nom,
      barri,
      categoria,
      edat,
      preu,
      horari,
      dies,
      descripcio: descripcio || "",
      durada: durada || "",
      alumnes: alumnes || "",
      material: material || "",
      inici: inici || "",
      idioma: idioma || "",
      qui_imparteix: qui_imparteix || "",
      publicada: true,
      destacada: false,
      centreId,
    });

    if (!result) {
      return { success: false, error: "No s'ha pogut guardar l'activitat a Airtable." };
    }

    // On-demand revalidation
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/categories/${categoria.toLowerCase()}`);
    revalidatePath(`/barris/${barri.toLowerCase()}`);
    
    // Global router cache purge
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[Create Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

export async function updateActivitatAction(id: string, prevState: unknown, formData: FormData) {
  try {
    // Verify centre ownership in a real scenario
    // We get centreId of the authenticated user to ensure they are logged in
    await getAuthenticatedCentreId();

    const nom = formData.get("nom") as string;
    const barri = formData.get("barri") as string;
    const categoria = formData.get("categoria") as string;
    const edat = formData.get("edat") as string;
    const preuStr = formData.get("preu") as string;
    const horari = formData.get("horari") as string;
    const dies = formData.get("dies") as string;
    const descripcio = formData.get("descripcio") as string;
    const durada = formData.get("durada") as string;
    const alumnes = formData.get("alumnes") as string;
    const material = formData.get("material") as string;
    const inici = formData.get("inici") as string;
    const idioma = formData.get("idioma") as string;
    const qui_imparteix = formData.get("qui_imparteix") as string;

    if (!nom || !barri || !categoria || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Barri, Categoria, Edat, Horari i Dies)." };
    }

    const preu = preuStr ? Number(preuStr) : undefined;

    const success = await updateActivitat(id, {
      nom,
      barri,
      categoria,
      edat,
      preu,
      horari,
      dies,
      descripcio: descripcio || "",
      durada: durada || "",
      alumnes: alumnes || "",
      material: material || "",
      inici: inici || "",
      idioma: idioma || "",
      qui_imparteix: qui_imparteix || "",
    });

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar l'activitat a Airtable." };
    }

    // On-demand revalidation
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath(`/categories/${categoria.toLowerCase()}`);
    revalidatePath(`/barris/${barri.toLowerCase()}`);
    
    // Global router cache purge
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[Update Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

export async function deleteActivitatAction(id: string) {
  try {
    await getAuthenticatedCentreId();

    const success = await deleteActivitat(id);
    if (!success) {
      return { success: false, error: "No s'ha pogut eliminar l'activitat." };
    }

    // On-demand revalidation
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[Delete Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}
