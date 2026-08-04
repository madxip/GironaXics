import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { 
  getDbCategories, 
  getDbSubcategories, 
  getDbCasalsBanners, 
  getDbSponsors, 
  getDbUsuaris, 
  getDbPoblacions, 
  getDbAnalytics,
  deleteDbSponsor,
  deleteDbCasalsBanner,
  deleteDbCategory,
  deleteDbSubcategory
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab");

    if (tab === "categories") {
      const categories = await getDbCategories();
      const subcategories = await getDbSubcategories();
      return NextResponse.json({ categories, subcategories });
    } else if (tab === "casals") {
      const casals = await getDbCasalsBanners();
      return NextResponse.json({ casals });
    } else if (tab === "sponsors") {
      const sponsors = await getDbSponsors();
      return NextResponse.json({ sponsors });
    } else if (tab === "usuaris") {
      const usuaris = await getDbUsuaris();
      return NextResponse.json({ usuaris });
    } else if (tab === "poblacions") {
      const poblacions = await getDbPoblacions();
      return NextResponse.json({ poblacions });
    } else if (tab === "analytics") {
      const analytics = await getDbAnalytics();
      return NextResponse.json({ analytics });
    }

    return NextResponse.json({ error: "Tab no vàlid" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Tab Data API] Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const item = searchParams.get("item");
    const id = searchParams.get("id");

    if (!item || !id) {
      return NextResponse.json({ error: "Paràmetres no vàlids" }, { status: 400 });
    }

    let ok = false;
    if (item === "sponsor") {
      ok = await deleteDbSponsor(id);
    } else if (item === "casal") {
      ok = await deleteDbCasalsBanner(id);
    } else if (item === "category") {
      ok = await deleteDbCategory(id);
    } else if (item === "subcategory") {
      ok = await deleteDbSubcategory(id);
    }

    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "No s'ha pogut eliminar l'element" }, { status: 500 });
  } catch (error) {
    console.error("[Admin Tab Delete API] Error:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
