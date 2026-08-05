"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail as getAirtableUser, createUser as createAirtableUser, createCentre as createAirtableCentre } from "@/lib/airtable";
import { getDbUserByEmail, createDbUsuari, createDbCentre, supabase } from "@/lib/db";
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

  if (password.length < 8) {
    return { success: false, error: "La contrasenya ha de tenir com a mínim 8 caràcters." };
  }

  if (centreId === "nou-centre" && !nouCentreNom) {
    return { success: false, error: "Si us plau, especifica el nom del nou centre." };
  }

  const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

  try {
    // 1. Check if user already exists
    const existingUser = useDb ? await getDbUserByEmail(email) : await getAirtableUser(email);
    if (existingUser) {
      return { success: false, error: "Aquest correu ja està registrat en un compte existent." };
    }

    // 2. If it's a new center, create it first
    if (centreId === "nou-centre") {
      const newCentre = useDb ? await createDbCentre(nouCentreNom) : await createAirtableCentre(nouCentreNom);
      if (!newCentre) {
        return { success: false, error: "No s'ha pogut crear el nou centre. Torna-ho a provar." };
      }
      if ('error' in newCentre && newCentre.error === 'quota') {
        return { success: false, error: "El servei de registre no està disponible temporalment per límit de capacitat. Si us plau, contacta amb hola@gironaxics.cat perquè et registrem manualment." };
      }
      centreId = newCentre.id;
      
      revalidatePath("/registre");
    }

    // 3. Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 4. Create the user linked to the center
    const newUser = useDb 
      ? await createDbUsuari({ nom, email, passwordHash, centreId })
      : await createAirtableUser({ nom, email, passwordHash, centreId });

    if (!newUser) {
      return { success: false, error: "S'ha produït un error al registrar el compte. Torna-ho a provar." };
    }

    // 5. Send notification email to the administrator (hola@gironaxics.cat)
    try {
      await sendInternalEmail({
        type: 'registre',
        nom: nom,
        email: email,
        centreNom: nouCentreNom || "Centre Existent (ID: " + centreId + ")",
        missatge: `S'ha registrat un nou compte de centre a la plataforma GironaXics.

Dades del registre:
- Nom del contacte: ${nom}
- Correu electrònic: ${email}
- Nom del centre: ${nouCentreNom || "Enllaçat a centre existent"}
- ID del centre: ${centreId}`,
      });
    } catch (mailError) {
      console.error("[Register Action] Error sending admin notification email:", mailError);
    }

    return { success: true };
  } catch (error) {
    console.error("[Register Action] Error:", error);
    return { success: false, error: "S'ha produït un error inesperat al registrar el compte." };
  }
}
