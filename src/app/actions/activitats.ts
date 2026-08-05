"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { 
  createActivitat as createAirtableActivitat, 
  updateActivitat as updateAirtableActivitat, 
  deleteActivitat as deleteAirtableActivitat, 
  getActivitatRawById as getAirtableActivitatRawById, 
  clearAllCache 
} from "@/lib/airtable";
import { 
  createDbActivitat, 
  updateDbActivitat, 
  deleteDbActivitat, 
  getDbActivitatRawById, 
  supabase 
} from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { normalizeSlug } from "@/lib/utils";

// Helper: retorna centreId i si és admin
async function getAuthInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Sessió no autoritzada.");
  }
  const isAdmin = !!session.user.isAdmin;
  if (!isAdmin && !session.user.centreId) {
    throw new Error("Sessió no autoritzada.");
  }
  return { centreId: session.user.centreId || "", isAdmin };
}

export async function createActivitatAction(prevState: unknown, formData: FormData) {
  try {
    const { centreId: sessionCentreId, isAdmin } = await getAuthInfo();
    const centreId = isAdmin
      ? (formData.get("centreId") as string || sessionCentreId)
      : sessionCentreId;

    const nom = formData.get("nom") as string;
    const barri = formData.get("barri") as string;
    const categories = formData.getAll("categoria") as string[];
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
    const subcategoria = formData.get("subcategoria") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;
    const tipus = formData.get("tipus") as string;
    const torns = formData.get("torns") as string;
    const poblacio_propia = formData.get("poblacio_propia") as string;
    const adreca_propia = formData.get("adreca_propia") as string;

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

    if (!nom || categories.length === 0 || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Categoria, Edat, Horari i Dies)." };
    }

    if (!centreId) {
      return { success: false, error: "Has de seleccionar un centre per a aquesta activitat." };
    }

    const preu = preuStr ? preuStr.trim() : undefined;
    const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

    const actData = {
      nom,
      barri,
      categoria: categories,
      subcategoria: subcategoria || undefined,
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
      imatgeUrl: imatgeUrl || undefined,
      galeria: galeria.length > 0 ? galeria : undefined,
      tipus: tipus || "Extraescolar",
      torns: torns || undefined,
      poblacio_propia: poblacio_propia || undefined,
      adreca_propia: adreca_propia || undefined
    };

    let resultId: string | null = null;
    let slug: string = normalizeSlug(nom);

    if (useDb) {
      resultId = await createDbActivitat(actData);
    } else {
      const res = await createAirtableActivitat(actData);
      if (res && res.id) {
        resultId = res.id;
        if (res.slug) slug = res.slug;
      }
    }

    if (!resultId) {
      return { success: false, error: "No s'ha pogut guardar l'activitat a la base de dades." };
    }

    try {
      revalidateTag('activitats');
      revalidatePath("/");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/':", e);
    }
    try {
      revalidatePath("/dashboard");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/dashboard':", e);
    }
    categories.forEach(cat => {
      try {
        revalidatePath(`/categories/${normalizeSlug(cat)}`);
      } catch (e) {
        console.error(`[Revalidate] Error revalidating '/categories/${normalizeSlug(cat)}':`, e);
      }
    });
    try {
      revalidatePath(`/barris/${normalizeSlug(barri)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/barris/${normalizeSlug(barri)}':`, e);
    }
    try {
      if (slug) {
        revalidatePath(`/activitats/${normalizeSlug(categories[0] || 'altres')}/${slug}`);
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
    const { centreId, isAdmin } = await getAuthInfo();
    const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

    const activitat = useDb ? await getDbActivitatRawById(id) : await getAirtableActivitatRawById(id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix." };
    }
    if (!isAdmin && activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per modificar aquesta activitat." };
    }

    const nom = formData.get("nom") as string;
    const barri = formData.get("barri") as string;
    const categories = formData.getAll("categoria") as string[];
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
    const subcategoria = formData.get("subcategoria") as string;
    const imatgeUrl = formData.get("imatgeUrl") as string;
    const tipus = formData.get("tipus") as string;
    const torns = formData.get("torns") as string;
    const poblacio_propia = formData.get("poblacio_propia") as string;
    const adreca_propia = formData.get("adreca_propia") as string;

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

    if (!nom || categories.length === 0 || !edat || !horari || !dies) {
      return { success: false, error: "Si us plau, omple com a mínim els camps obligatoris (Nom, Categoria, Edat, Horari i Dies)." };
    }

    const preu = preuStr ? preuStr.trim() : undefined;
    const updateData = {
      nom,
      barri,
      categoria: categories,
      subcategoria: subcategoria !== null ? subcategoria : undefined,
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
      imatgeUrl: imatgeUrl !== null ? imatgeUrl : undefined,
      galeria: galeria !== undefined ? galeria : undefined,
      tipus: tipus || "Extraescolar",
      torns: torns !== null ? torns : undefined,
      poblacio_propia: poblacio_propia !== null ? poblacio_propia : undefined,
      adreca_propia: adreca_propia !== null ? adreca_propia : undefined
    };

    const success = useDb 
      ? await updateDbActivitat(id, updateData) 
      : await updateAirtableActivitat(id, updateData);

    if (!success) {
      return { success: false, error: "No s'ha pogut actualitzar l'activitat." };
    }

    if (!useDb) {
      clearAllCache(revalidateTag);
    }

    try {
      revalidateTag('activitats');
      revalidatePath("/");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/':", e);
    }
    try {
      revalidatePath("/dashboard");
    } catch (e) {
      console.error("[Revalidate] Error revalidating '/dashboard':", e);
    }
    categories.forEach(cat => {
      try {
        revalidatePath(`/categories/${normalizeSlug(cat)}`);
      } catch (e) {
        console.error(`[Revalidate] Error revalidating '/categories/${normalizeSlug(cat)}':`, e);
      }
    });
    try {
      revalidatePath(`/barris/${normalizeSlug(barri)}`);
    } catch (e) {
      console.error(`[Revalidate] Error revalidating '/barris/${normalizeSlug(barri)}':`, e);
    }
    try {
      const baseSlug = normalizeSlug(nom);
      const newSlug = baseSlug.endsWith('-girona') ? baseSlug : `${baseSlug}-girona`;
      revalidatePath(`/activitats/${normalizeSlug(categories[0] || 'altres')}/${newSlug}`);
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
    const { centreId, isAdmin } = await getAuthInfo();
    const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

    const activitat = useDb ? await getDbActivitatRawById(id) : await getAirtableActivitatRawById(id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix o ja ha estat eliminada." };
    }
    if (!isAdmin && activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per eliminar aquesta activitat." };
    }

    const success = useDb ? await deleteDbActivitat(id) : await deleteAirtableActivitat(id);
    if (!success) {
      return { success: false, error: "No s'ha pogut eliminar l'activitat." };
    }

    try {
      revalidateTag('activitats');
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
    const { centreId, isAdmin } = await getAuthInfo();
    const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

    const activitat = useDb ? await getDbActivitatRawById(id) : await getAirtableActivitatRawById(id);
    if (!activitat) {
      return { success: false, error: "L'activitat no existeix." };
    }
    if (!isAdmin && activitat.centreId !== centreId) {
      return { success: false, error: "No tens permís per canviar l'estat d'aquesta activitat." };
    }

    const success = useDb ? await updateDbActivitat(id, { publicada }) : await updateAirtableActivitat(id, { publicada });
    if (!success) {
      return { success: false, error: "No s'ha pogut canviar l'estat de publicació." };
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

    return { success: true };
  } catch (error) {
    console.error("[Toggle Publicada Action] Error:", error);
    const message = error instanceof Error ? error.message : "S'ha produït un error inesperat.";
    return { success: false, error: message };
  }
}

