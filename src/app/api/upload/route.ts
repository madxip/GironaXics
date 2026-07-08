import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    // Admins no tenen centreId però sí poden pujar imatges
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

    // 3. Intentar pujar a Catbox (permanent i ràpid)
    try {
      const catboxForm = new FormData();
      catboxForm.append("reqtype", "fileupload");
      const blob = new Blob([buffer], { type: file.type });
      catboxForm.append("fileToUpload", blob, file.name);

      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: catboxForm,
        // Short timeout for fallback safety
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

    // 3.5. Fallback alternatiu: Uguu.se (durada de 24h, ideal per a Airtable)
    try {
      const uguuForm = new FormData();
      const blob = new Blob([buffer], { type: file.type });
      uguuForm.append("files[]", blob, file.name);

      const response = await fetch("https://uguu.se/upload.php", {
        method: "POST",
        body: uguuForm,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.files?.[0]?.url) {
          return NextResponse.json({ url: resData.files[0].url });
        }
      }
    } catch (uguuErr) {
      console.warn("[Upload API] Error amb Uguu.se, intentant fallback a Tmpfiles:", uguuErr);
    }

    // 4. Fallback: Pujar a TmpFiles (Airtable importarà la imatge immediatament abans de l'expiració de 60 minuts)
    try {
      const tmpForm = new FormData();
      const blob = new Blob([buffer], { type: file.type });
      tmpForm.append("file", blob, file.name);

      const response = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: tmpForm,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.status === "success" && resData.data?.url) {
          // Converteix la URL de visualització a la URL de descàrrega directa requerida per Airtable
          // Visualització: https://tmpfiles.org/123456/imatge.png
          // Directe: https://tmpfiles.org/dl/123456/imatge.png
          const directUrl = resData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
          return NextResponse.json({ url: directUrl });
        }
      }
    } catch (tmpErr) {
      console.error("[Upload API] Error amb Tmpfiles:", tmpErr);
    }

    return NextResponse.json({ error: "Tots els serveis de pujada d'imatges han fallat." }, { status: 500 });
  } catch (error) {
    console.error("[Upload API] Error general:", error);
    return NextResponse.json({ error: "S'ha produït un error al servidor." }, { status: 500 });
  }
}
