"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/airtable";

export async function registerCentreAction(prevState: unknown, formData: FormData) {
  const nom = formData.get("nom") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const centreId = formData.get("centreId") as string;

  if (!nom || !email || !password || !centreId) {
    return { success: false, error: "Si us plau, omple tots els camps del formulari." };
  }

  try {
    // 1. Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "Aquest correu ja està registrat en un altre compte." };
    }

    // 2. Hash the password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // 3. Create the user in Airtable
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
