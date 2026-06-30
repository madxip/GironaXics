import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentreByIdDirect, getPoblacions } from "@/lib/airtable";
import { redirect } from "next/navigation";
import CentreForm from "./CentreForm";

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

  // Carrega el centre directament per ID
  const currentCentre = await getCentreByIdDirect(centreId);

  if (!currentCentre) {
    redirect("/dashboard");
  }

  // Carrega totes les poblacions d'Airtable i les agrupa per comarca
  const allPoblacions = await getPoblacions();
  const poblacionsGrouped: Record<string, string[]> = {};

  allPoblacions.forEach(p => {
    if (p.comarca && p.nom) {
      if (!poblacionsGrouped[p.comarca]) {
        poblacionsGrouped[p.comarca] = [];
      }
      poblacionsGrouped[p.comarca].push(p.nom);
    }
  });

  return (
    <CentreForm
      initialData={currentCentre}
      poblacions={poblacionsGrouped}
    />
  );
}
