import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentres, getActivitats } from "@/lib/airtable";
import { redirect } from "next/navigation";
import CentreForm from "./CentreForm";

export const dynamic = "force-dynamic";

const DEFAULT_BARRIS = [
  "Barri Vell",
  "Centre",
  "Devesa",
  "Eixample",
  "Fontajau",
  "Germans Sàbat",
  "Mas Xirgu",
  "Montilivi",
  "Palau",
  "Pedret",
  "Pont Major",
  "Salt",
  "Sant Daniel",
  "Sant Narcís",
  "Santa Eugènia",
  "Vila-roja i Font de la Pólvora",
  "Vista Alegre - Carme"
];

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

  // Get active neighborhoods to merge with defaults for the dropdown selection
  const activitats = await getActivitats();
  const barris = Array.from(new Set([
    ...activitats.map(a => a.barri).filter(Boolean),
    ...DEFAULT_BARRIS
  ])).sort();

  return (
    <CentreForm
      initialData={currentCentre}
      barris={barris}
    />
  );
}
