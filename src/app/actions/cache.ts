"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { clearAllCache } from "@/lib/airtable";

/**
 * Acció admin: invalida la memòria cau d'Airtable i força la re-renderització
 * de totes les pàgines públiques a Vercel ISR.
 * Útil quan l'admin ha modificat dades directament a Airtable sense passar pel panell.
 */
export async function refreshCacheAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return { success: false, error: "No autoritzat." };
    }

    // 1. Netejar la memòria cau en memòria d'Airtable
    clearAllCache();

    // 2. Invalidar les pàgines estàtiques/ISR de Vercel
    const paths = ["/", "/categories", "/barris"];
    for (const path of paths) {
      try { revalidatePath(path); } catch { /* ignore */ }
    }

    return { success: true };
  } catch (error) {
    console.error("[RefreshCache] Error:", error);
    return { success: false, error: "Error al netejar la memòria cau." };
  }
}
