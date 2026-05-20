"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail, createUser, createCentre } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

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
      return { success: false, error: "Aquest correu ja està registrat en un altre compte." };
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

    return { success: true };
  } catch (error) {
    console.error("[Register Action] Error:", error);
    return { success: false, error: "S'ha produït un error inesperat al registrar el compte." };
  }
}
