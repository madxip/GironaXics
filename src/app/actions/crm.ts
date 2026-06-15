"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentresWithContacts, updateCentreAndContact, getActivitiesByCentre, createCentreWithContact, CRMCentre, CRMActivity } from "@/lib/crm";
import { updateActivitat } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

// Helper to verify admin permissions
async function verifyAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Sessió no iniciada.");
  }
  if (!session.user.isAdmin) {
    throw new Error("Accés denegat. Permisos d'administrador requerits.");
  }
  return session.user;
}

/**
 * Fetch all centres with contact details.
 * Admin only.
 */
export async function getCentresAction(): Promise<CRMCentre[]> {
  await verifyAdminUser();
  return getCentresWithContacts();
}

/**
 * Update centre fields and contact user fields.
 * Admin only.
 */
export async function updateCentreAction(
  centreId: string,
  centreData: Partial<Omit<CRMCentre, 'id' | 'contactName' | 'contactEmail' | 'contactUserId' | 'activityCount'>>,
  contactData: { nom?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminUser();
    const success = await updateCentreAndContact(centreId, centreData, contactData);
    if (success) {
      revalidatePath("/dashboard/crm");
      return { success: true };
    }
    return { success: false, error: "No s'ha pogut actualitzar el centre." };
  } catch (err) {
    console.error('[CRM Server Action] Error updating centre:', err);
    const message = err instanceof Error ? err.message : "Error de connexió.";
    return { success: false, error: message };
  }
}

/**
 * Fetch all activities belonging to a centre.
 * Admin only.
 */
export async function getCentreActivitiesAction(centreId: string, centreNom: string): Promise<CRMActivity[]> {
  await verifyAdminUser();
  return getActivitiesByCentre(centreId, centreNom);
}

/**
 * Update any activity details from the CRM.
 * Admin only.
 */
export async function updateCRMActivityAction(
  activityId: string,
  data: {
    nom?: string;
    barri?: string;
    categoria?: string;
    edat?: string;
    preu?: number | string;
    horari?: string;
    dies?: string;
    descripcio?: string;
    publicada?: boolean;
    destacada?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminUser();
    
    // Call the Airtable library update function
    const success = await updateActivitat(activityId, {
      nom: data.nom,
      barri: data.barri,
      categoria: data.categoria,
      edat: data.edat,
      preu: data.preu,
      horari: data.horari,
      dies: data.dies,
      descripcio: data.descripcio,
      publicada: data.publicada,
      destacada: data.destacada
    });

    if (success) {
      revalidatePath("/dashboard/crm");
      return { success: true };
    }
    return { success: false, error: "No s'ha pogut actualitzar l'activitat." };
  } catch (err) {
    console.error('[CRM Server Action] Error updating activity:', err);
    const message = err instanceof Error ? err.message : "Error actualitzant l'activitat.";
    return { success: false, error: message };
  }
}

/**
 * Create a new centre and its contact user.
 * Admin only.
 */
export async function createCentreAction(
  nom: string,
  centreData: { adreca?: string; telefon?: string; email?: string; web?: string; barri?: string; descripcio?: string },
  contactData: { nom?: string; email?: string }
): Promise<{ success: boolean; centre?: CRMCentre; error?: string }> {
  try {
    await verifyAdminUser();
    const centre = await createCentreWithContact(nom, centreData, contactData);
    if (centre) {
      revalidatePath("/dashboard/crm");
      return { success: true, centre };
    }
    return { success: false, error: "No s'ha pogut crear el centre." };
  } catch (err) {
    console.error('[CRM Server Action] Error creating centre:', err);
    const message = err instanceof Error ? err.message : "Error creant el centre.";
    return { success: false, error: message };
  }
}
