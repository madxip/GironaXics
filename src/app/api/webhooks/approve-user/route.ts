import { NextRequest, NextResponse } from "next/server";
import { sendApprovalEmail } from "@/app/actions/sendEmail";
import { approveCentreAndActivate } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar el token secret de seguretat
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error("[Webhook Approval] Falta definir la variable d'entorn WEBHOOK_SECRET al servidor.");
      return NextResponse.json(
        { error: "El servidor de webhooks no està completament configurat." },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn("[Webhook Approval] Intent d'accés no autoritzat amb un secret incorrecte o buit.");
      return NextResponse.json(
        { error: "No autoritzat. El secret de seguretat és invàlid." },
        { status: 401 }
      );
    }

    // 2. Processar el cos (payload) de la petició
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Cos de petició no vàlid. S'espera un format JSON." },
        { status: 400 }
      );
    }

    const { email, nom, centreNom, centreId } = body;

    // Convertir a string si són arrays (per exemple, si venen de camps lookup de relacions d'Airtable/Make)
    const emailStr = (Array.isArray(email) ? email[0] : email)?.toString();
    const nomStr = (Array.isArray(nom) ? nom[0] : nom)?.toString();
    const centreNomStr = (Array.isArray(centreNom) ? centreNom[0] : centreNom)?.toString();
    const centreIdStr = (Array.isArray(centreId) ? centreId[0] : centreId)?.toString();

    // 3. Validacions bàsiques de dades obligatòries
    if (!emailStr || !nomStr || (!centreNomStr && !centreIdStr)) {
      return NextResponse.json(
        { error: "Dades incompletes. S'espera 'email', 'nom' i 'centreNom' o 'centreId' al cos de la petició." },
        { status: 400 }
      );
    }

    // 4. Activar automàticament els camps 'actiu' i 'interessat' a la taula Centres d'Airtable
    const targetCentre = centreIdStr || centreNomStr || "";
    if (targetCentre) {
      console.log(`[Webhook Approval] S'està activant el centre '${targetCentre}' (actiu=true, interessat=true) a Airtable...`);
      await approveCentreAndActivate(targetCentre);
    }

    // 5. Enviar correu de confirmació d'aprovació
    console.log(`[Webhook Approval] S'està enviant el correu de confirmació d'aprovació per a: ${nomStr} (${emailStr}) del centre ${centreNomStr || centreIdStr}`);
    await sendApprovalEmail({
      email: emailStr,
      nom: nomStr,
      centreNom: centreNomStr || centreIdStr || "",
    });

    return NextResponse.json({
      success: true,
      message: `Correu de confirmació enviat correctament a ${email}.`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconegut";
    console.error("[Webhook Approval] Error al processar el webhook d'aprovació:", error);
    return NextResponse.json(
      { error: "S'ha produït un error al servidor en processar el webhook.", details: errorMessage },
      { status: 500 }
    );
  }
}
