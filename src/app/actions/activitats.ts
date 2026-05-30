"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createActivitat, updateActivitat, deleteActivitat, getActivitats } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { normalizeSlug } from "@/lib/utils";

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
    const inici = formData.get("inici") as string;
    const idioma = formData.get("idioma") as string;
    const qui_imparteix = formData.get("qui_imparteix") as string;
    const subcategoria = formData.get("subcategoria") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;
    const tipus = formData.get("tipus") as string;

    // Parse galeria robustly
    const galeriaRaw = formData.get("galeria");
    let galeria: string[] = [];
    if (galeriaRaw) {
      try {
        galeria = JSON.parse(galeriaRaw as string);
      } catch {
        galeria = formData.getAll("galeria") as string[];
      }
    } else {
      galeria = formData.getAll("galeria") as string[];
    }

    if (!nom || !barri || !categoria || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Barri, Categoria, Edat, Horari i Dies)." };
    }

    const preu = preuStr ? preuStr.trim() : undefined;

    const result = await createActivitat({
      nom,
      barri,
      categoria,
      subcategoria: subcategoria || undefined,
      edat,
      preu,
      horari,
      dies,
      descripcio: descripcio || "",
      durada: durada || "",
      alumnes: alumnes || "",
      material: "",
      inici: inici || "",
      idioma: idioma || "",
      qui_imparteix: qui_imparteix || "",
      publicada: true,
      destacada: false,
      centreId,
      imatgeUrl: imatgeUrl || undefined,
      galeria: galeria.length > 0 ? galeria : undefined,
      tipus: tipus || "Extraescolar"
    });

    if (!result) {
      return { success: false, error: "No s'ha pogut guardar l'activitat a Airtable." };
    }

    // On-demand revalidation
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
      revalidatePath(`/categories/${normalizeSlug(categoria)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/categories/${normalizeSlug(categoria)}':`, e);
    }
    try {
      revalidatePath(`/barris/${normalizeSlug(barri)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/barris/${normalizeSlug(barri)}':`, e);
    }
    try {
      if (result && result.slug) {
        revalidatePath(`/activitats/${normalizeSlug(categoria)}/${result.slug}`);
      }
    } catch (e) {
      console.error("[Revalidate] Error revalidating activity page:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[Create Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

export async function updateActivitatAction(id: string, prevState: unknown, formData: FormData) {
  try {
    const centreId = await getAuthenticatedCentreId();

    // Ownership check (IDOR/BOLA prevention)
    const activitats = await getActivitats();
    const activitat = activitats.find(a => a.id === id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix." };
    }
    if (activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per modificar aquesta activitat." };
    }

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
    const inici = formData.get("inici") as string;
    const idioma = formData.get("idioma") as string;
    const qui_imparteix = formData.get("qui_imparteix") as string;
    const subcategoria = formData.get("subcategoria") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;
    const tipus = formData.get("tipus") as string;

    const galeriaRaw = formData.get("galeria");
    let galeria: string[] | undefined = undefined;
    if (galeriaRaw !== null) {
      try {
        galeria = JSON.parse(galeriaRaw as string);
      } catch {
        galeria = formData.getAll("galeria") as string[];
      }
    } else if (formData.has("galeria")) {
      galeria = formData.getAll("galeria") as string[];
    }

    if (!nom || !barri || !categoria || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Barri, Categoria, Edat, Horari i Dies)." };
    }

    const preu = preuStr ? preuStr.trim() : undefined;

    const success = await updateActivitat(id, {
      nom,
      barri,
      categoria,
      subcategoria: subcategoria !== null ? subcategoria : undefined,
      edat,
      preu,
      horari,
      dies,
      descripcio: descripcio || "",
      durada: durada || "",
      alumnes: alumnes || "",
      inici: inici || "",
      idioma: idioma || "",
      qui_imparteix: qui_imparteix || "",
      imatgeUrl: imatgeUrl !== null ? imatgeUrl : undefined,
      galeria: galeria !== undefined ? galeria : undefined,
      tipus: tipus || "Extraescolar"
    });

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar l'activitat a Airtable." };
    }

    // On-demand revalidation
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
      revalidatePath(`/categories/${normalizeSlug(categoria)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/categories/${normalizeSlug(categoria)}':`, e);
    }
    try {
      revalidatePath(`/barris/${normalizeSlug(barri)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/barris/${normalizeSlug(barri)}':`, e);
    }
    try {
      const baseSlug = normalizeSlug(nom);
      const newSlug = baseSlug.endsWith('-girona') ? baseSlug : `${baseSlug}-girona`;
      revalidatePath(`/activitats/${normalizeSlug(categoria)}/${newSlug}`);
    } catch (e) {
      console.error("[Revalidate] Error revalidating activity page:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[Update Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

export async function deleteActivitatAction(id: string) {
  try {
    const centreId = await getAuthenticatedCentreId();

    // Ownership check (IDOR/BOLA prevention)
    const activitats = await getActivitats();
    const activitat = activitats.find(a => a.id === id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix o ja ha estat eliminada." };
    }
    if (activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per eliminar aquesta activitat." };
    }

    const success = await deleteActivitat(id);
    if (!success) {
      return { success: false, error: "No s'ha pogut eliminar l'activitat." };
    }

    // On-demand revalidation
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

    return { success: true };
  } catch (error) {
    console.error("[Delete Activity Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

export async function togglePublicadaAction(id: string, publicada: boolean) {
  try {
    const centreId = await getAuthenticatedCentreId();

    // Ownership check (IDOR/BOLA prevention)
    const activitats = await getActivitats();
    const activitat = activitats.find(a => a.id === id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix." };
    }
    if (activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per canviar l'estat d'aquesta activitat." };
    }

    const success = await updateActivitat(id, { publicada });
    if (!success) {
      return { success: false, error: "No s'ha pogut canviar l'estat de publicació." };
    }

    // Revalidar memòria cau a Vercel on-demand per a que es reflecteixi immediatament
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

    return { success: true };
  } catch (error) {
    console.error("[Toggle Publicada Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

