"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail, createUser, createCentre } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { sendInternalEmail } from "./sendEmail";

export async function registerCentreAction(prevState: unknown, formData: FormData) {
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  let centreId = formData.get("centreId") as string;
  const nouCentreNom = formData.get("nouCentreNom") as string;

  if (!nom || !email || !password || !centreId) {
    return { success: false, error: "Si us plau, omple tots els camps del formulari." };
  }

  if (centreId === "nou-centre" && !nouCentreNom) {
    return { success: false, error: "Si us plau, especifica el nom del nou centre." };
  }

  try {
    // 1. Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "Aquest correu ja està registrat en un compte existent." };
    }

    // 2. If it's a new center, create it in Airtable first
    if (centreId === "nou-centre") {
      const newCentre = await createCentre(nouCentreNom);
      if (!newCentre) {
        return { success: false, error: "No s'ha pogut crear el nou centre a Airtable. Torna-ho a provar." };
      }
      centreId = newCentre.id;
      
      // Force path revalidation since the list of centers has changed
      revalidatePath("/registre");
    }

    // 3. Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 4. Create the user in Airtable linked to the center
    const newUser = await createUser({
      nom,
      email,
      passwordHash,
      centreId,
    });

    if (!newUser) {
      return { success: false, error: "S'ha produït un error al registrar el compte a Airtable. Torna-ho a provar." };
    }

    // 5. Send notification email to the administrator (hola@gironaxics.cat)
    try {
      await sendInternalEmail({
        type: 'centre',
        nom: nom,
        email: email,
        centreNom: nouCentreNom || "Centre Existent (ID: " + centreId + ")",
        missatge: `S'ha registrat un nou compte de centre a la plataforma GironaXics.

Dades del registre:
- Nom del contacte: ${nom}
- Correu electrònic: ${email}
- Nom del centre: ${nouCentreNom || "Enllaçat a centre existent"}
- ID del centre: ${centreId}

Si us plau, accedeix a Airtable per validar el centre o l'usuari i activar el compte si cal.`,
      });
    } catch (mailError) {
      // Don't block registration if email notification fails
      console.error("[Register Action] Error sending admin notification email:", mailError);
    }

    return { success: true };
  } catch (error) {
    console.error("[Register Action] Error:", error);
    return { success: false, error: "S'ha produït un error inesperat al registrar el compte." };
  }
}
