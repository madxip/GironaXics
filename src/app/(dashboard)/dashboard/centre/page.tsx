import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentreByIdDirect, getActivitats } from "@/lib/airtable";
import { redirect } from "next/navigation";
import CentreForm from "./CentreForm";
import { BARRIS_GIRONA, BARRIS_GIRONA_SET } from "@/lib/barris";

export const dynamic = "force-dynamic";

export default async function CentreDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const centreId = session.user.centreId;
  if (!centreId) {
    redirect("/dashboard");
  }

  // Carrega el centre directament per ID, sense el filtre actiu=true,
  // per permetre que centres nous (no publicats encara) puguin editar les seves dades.
  const currentCentre = await getCentreByIdDirect(centreId);

  if (!currentCentre) {
    redirect("/dashboard");
  }

  // Barris de Girona (llista fixa) + Altres poblacions (qualsevol barri no reconegut)
  const activitats = await getActivitats();
  const altresBarris = Array.from(new Set(
    activitats.map(a => a.barri?.trim()).filter((b): b is string => !!b && !BARRIS_GIRONA_SET.has(b))
  )).sort();
  const barris = { girona: BARRIS_GIRONA, altres: altresBarris };

  return (
    <CentreForm
      initialData={currentCentre}
      barris={barris}
    />
  );
}
