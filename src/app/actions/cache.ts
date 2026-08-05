"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { clearAllCache } from "@/lib/airtable";

/**
 * Acció admin: invalida la memòria cau de la base de dades i força la re-renderització
 * de totes les pàgines públiques.
 */
export async function refreshCacheAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return { success: false, error: "No autoritzat." };
    }

    // 1. Netejar la memòria cau en memòria d'Airtable i Next.js Data Cache
    clearAllCache(revalidateTag);

    // 2. Invalidar les pàgines estàtiques/ISR de Vercel a nivell global
    const paths = ["/", "/categories", "/barris", "/centres"];
    for (const path of paths) {
      try { revalidatePath(path); } catch { /* ignore */ }
    }

    return { success: true };
  } catch (error) {
    console.error("[RefreshCache] Error:", error);
    return { success: false, error: "Error al netejar la memòria cau." };
  }
}
