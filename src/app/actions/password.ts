"use server";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateUserPassword } from "@/lib/airtable";
import { sendPasswordResetEmail } from "./sendEmail";

const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no configurat");
  return new TextEncoder().encode(secret);
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Si us plau, introdueix un correu electrònic vàlid." };
  }

  try {
    const user = await getUserByEmail(email);
    if (user && user.aprovat) {
      const secret = getJwtSecret();
      const token = await new SignJWT({ userId: user.id, email: user.email, type: "password-reset" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .setIssuedAt()
        .sign(secret);

      const baseUrl = process.env.NEXTAUTH_URL || "https://gironaxics.cat";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        email: user.email,
        nom: user.nom || "Centre",
        resetUrl,
      });
    }

    // Sempre retornem exit per no revelar si el correu existeix (seguretat)
    return {
      success: true,
      message: "Si el correu és correcte, rebràs un missatge amb les instruccions en breus moments.",
    };
  } catch (error) {
    console.error("[forgotPasswordAction] Error:", error);
    return { success: false, error: "S'ha produït un error. Torna-ho a provar." };
  }
}

// ─── Reset Password (via token) ───────────────────────────────────────────────

export async function resetPasswordAction(prevState: unknown, formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { success: false, error: "Token de restabliment no vàlid o expirat." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "La nova contrasenya ha de tenir com a mínim 8 caràcters." };
  }
  if (password !== confirmPassword) {
    return { success: false, error: "Les contrasenyes no coincideixen." };
  }

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== "password-reset" || !payload.userId || typeof payload.userId !== "string") {
      return { success: false, error: "Token de restabliment no vàlid." };
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(password, salt);
    const ok = await updateUserPassword(payload.userId, newHash);

    if (!ok) {
      return { success: false, error: "No s'ha pogut actualitzar la contrasenya. Torna-ho a provar." };
    }

    return { success: true, message: "Contrasenya actualitzada correctament! Ja pots iniciar sessió." };
  } catch (error: unknown) {
    console.error("[resetPasswordAction] Error:", error);
    const isExpired =
      error instanceof Error && (error.message.includes("exp") || error.message.includes("expired"));
    if (isExpired) {
      return { success: false, error: "L'enllaç de restabliment ha expirat. Sol·licita'n un de nou." };
    }
    return { success: false, error: "Token no vàlid o expirat. Sol·licita un nou enllaç." };
  }
}

// ─── Change Password (des del panell) ────────────────────────────────────────

export async function changePasswordAction(prevState: unknown, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { success: false, error: "Has d'iniciar sessió per canviar la contrasenya." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Si us plau, omple tots els camps." };
  }
  if (newPassword.length < 8) {
    return { success: false, error: "La nova contrasenya ha de tenir com a mínim 8 caràcters." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Les noves contrasenyes no coincideixen." };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: "La nova contrasenya ha de ser diferent de l'actual." };
  }

  try {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return { success: false, error: "Usuari no trobat." };
    }

    const currentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!currentValid) {
      return { success: false, error: "La contrasenya actual no és correcta." };
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    const ok = await updateUserPassword(user.id, newHash);

    if (!ok) {
      return { success: false, error: "No s'ha pogut actualitzar la contrasenya. Torna-ho a provar." };
    }

    return { success: true, message: "Contrasenya actualitzada correctament!" };
  } catch (error) {
    console.error("[changePasswordAction] Error:", error);
    return { success: false, error: "S'ha produït un error inesperat. Torna-ho a provar." };
  }
}
