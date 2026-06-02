import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCentres } from "@/lib/airtable";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const isAdmin = session.user.isAdmin;

  // Get center name to display in the dashboard
  const centres = await getCentres();
  const userCentre = centres.find(c => c.id === session.user.centreId);
  const centreNom = isAdmin ? "Administrador" : (userCentre ? userCentre.nom : "El teu Centre");

  return (
    <DashboardLayoutClient
      centreNom={centreNom}
      userEmail={session.user.email || ""}
      isAdmin={isAdmin}
    >
      {children}
    </DashboardLayoutClient>
  );
}

