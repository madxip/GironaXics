import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

// Tipus MIME permesos (imatges)
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    // 0. Verificar autenticació
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autoritzat. Cal iniciar sessió per pujar fitxers." },
        { status: 401 }
      );
    }
    if (!session.user.centreId && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "No autoritzat. Cal iniciar sessió per pujar fitxers." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No s'ha proporcionat cap fitxer." }, { status: 400 });
    }

    // 1. Validar tipus MIME
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Tipus de fitxer no permès. Només s'accepten imatges (JPEG, PNG, WebP, AVIF, GIF, HEIC)." },
        { status: 400 }
      );
    }

    // 2. Validar mida del fitxer
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El fitxer és massa gran. La mida màxima permesa és 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Vercel Blob Storage (permanent, primera opció)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `imatges/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: file.type,
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobErr) {
        console.warn("[Upload API] Error amb Vercel Blob, intentant fallback a Catbox:", blobErr);
      }
    }

    // 4. Fallback: Catbox.moe (permanent)
    try {
      const catboxForm = new FormData();
      catboxForm.append("reqtype", "fileupload");
      const catboxBlob = new Blob([buffer], { type: file.type });
      catboxForm.append("fileToUpload", catboxBlob, file.name);

      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: catboxForm,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const fileUrl = await response.text();
        if (fileUrl.startsWith("http")) {
          return NextResponse.json({ url: fileUrl.trim() });
        }
      }
    } catch (catboxErr) {
      console.warn("[Upload API] Error amb Catbox, intentant fallback a Uguu.se:", catboxErr);
    }

    // 5. Fallback: Uguu.se (24h — només emergència)
    try {
      const uguuForm = new FormData();
      const uguuBlob = new Blob([buffer], { type: file.type });
      uguuForm.append("files[]", uguuBlob, file.name);

      const response = await fetch("https://uguu.se/upload.php", {
        method: "POST",
        body: uguuForm,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.files?.[0]?.url) {
          console.warn("[Upload API] AVÍS: Imatge pujada a Uguu.se (temporal 24h). Vercel Blob no disponible.");
          return NextResponse.json({ url: resData.files[0].url });
        }
      }
    } catch (uguuErr) {
      console.error("[Upload API] Error amb Uguu.se:", uguuErr);
    }

    return NextResponse.json({ error: "Tots els serveis de pujada d'imatges han fallat." }, { status: 500 });
  } catch (error) {
    console.error("[Upload API] Error general:", error);
    return NextResponse.json({ error: "S'ha produït un error al servidor." }, { status: 500 });
  }
}
