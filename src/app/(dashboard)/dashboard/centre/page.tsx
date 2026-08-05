import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentreByIdDirect, getPoblacions } from "@/lib/airtable";
import { getDbCentreById, getDbPoblacions, supabase } from "@/lib/db";
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

  const useDb = process.env.DB_PROVIDER === 'supabase' || !!supabase;

  // Carrega el centre directament per ID
  const currentCentre = useDb ? await getDbCentreById(centreId) : await getCentreByIdDirect(centreId);

  if (!currentCentre) {
    redirect("/dashboard");
  }

  // Carrega totes les poblacions
  const allPoblacions = useDb ? await getDbPoblacions() : await getPoblacions();
  const poblacionsGrouped: Record<string, string[]> = {};

  (allPoblacions as any[]).forEach(p => {
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
