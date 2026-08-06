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

    // 1. Validar tipus MIME i extensió
    const fileType = (file.type || "").toLowerCase();
    const fileExt = (file.name.split('.').pop() || "").toLowerCase();
    const isAllowedType = ALLOWED_TYPES.has(fileType) || 
                          fileType.startsWith("image/") ||
                          ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"].includes(fileExt);

    if (!isAllowedType) {
      return NextResponse.json(
        { error: `Tipus de fitxer no permès (${file.name}). Només s'accepten imatges (JPEG, PNG, WebP, AVIF, GIF, HEIC).` },
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
        console.warn("[Upload API] Error amb Vercel Blob, intentant fallback:", blobErr);
      }
    }

    // 4. Fallback 1: ImgBB API (permanent, súper ràpid i 100% fiable)
    try {
      const imgbbForm = new FormData();
      imgbbForm.append("key", "6d207e60798348d40013c010e410b249");
      imgbbForm.append("image", buffer.toString("base64"));

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: imgbbForm,
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.data?.url && typeof json.data.url === "string") {
          return NextResponse.json({ url: json.data.url });
        }
      }
    } catch (imgbbErr) {
      console.warn("[Upload API] ImgBB no disponible, intentant següent fallback:", imgbbErr);
    }

    // 4. Fallback 1: Catbox.moe (permanent)
    try {
      const catboxForm = new FormData();
      catboxForm.append("reqtype", "fileupload");
      const catboxBlob = new Blob([buffer], { type: file.type });
      catboxForm.append("fileToUpload", catboxBlob, file.name);

      const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: catboxForm,
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const fileUrl = await response.text();
        if (fileUrl.startsWith("http")) {
          return NextResponse.json({ url: fileUrl.trim() });
        }
      }
    } catch (catboxErr) {
      console.warn("[Upload API] Catbox no disponible, intentant fallback 2:", catboxErr);
    }

    // 5. Fallback 2: Litterbox / Catbox Temporary API (segur, mai bloquejat per antivirus)
    try {
      const litterForm = new FormData();
      litterForm.append("reqtype", "fileupload");
      litterForm.append("time", "72h");
      const litterBlob = new Blob([buffer], { type: file.type });
      litterForm.append("fileToUpload", litterBlob, file.name);

      const response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
        method: "POST",
        body: litterForm,
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const fileUrl = await response.text();
        if (fileUrl.startsWith("http")) {
          return NextResponse.json({ url: fileUrl.trim() });
        }
      }
    } catch (litterErr) {
      console.warn("[Upload API] Litterbox no disponible, utilitzant Data URI 100% segur:", litterErr);
    }

    // 6. Fallback 3 d'emergència: Data URI en Base64 (100% segur, zero peticions a dominis externs, mai bloquejat)
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    return NextResponse.json({ url: dataUri });
  } catch (error) {
    console.error("[Upload API] Error general:", error);
    return NextResponse.json({ error: "S'ha produït un error al servidor." }, { status: 500 });
  }
}
