import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentres, getActivitats } from "@/lib/airtable";
import { redirect } from "next/navigation";
import CentreForm from "./CentreForm";
import { BARRIS_GIRONA, BARRIS_SALT } from "@/lib/barris";

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

  const centres = await getCentres();
  const currentCentre = centres.find(c => c.id === centreId);

  if (!currentCentre) {
    redirect("/dashboard");
  }

  // Barris de Girona (excloent Salt) + els que surtin a les activitats
  const activitats = await getActivitats();
  const barrisGirona = Array.from(new Set([
    ...activitats.map(a => a.barri?.trim()).filter((b): b is string => !!b && b !== 'Salt'),
    ...BARRIS_GIRONA
  ])).sort();
  const barris = { girona: barrisGirona, salt: BARRIS_SALT };

  return (
    <CentreForm
      initialData={currentCentre}
      barris={barris}
    />
  );
}
