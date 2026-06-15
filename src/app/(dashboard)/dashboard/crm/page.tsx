import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCentresWithContacts } from "@/lib/crm";
import CRMClient from "./CRMClient";
import { ShieldCheck, Info } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const session = await getServerSession(authOptions);

  // Auth check: Must be signed in and must be an Admin
  if (!session || !session.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  // Fetch initial centres with contacts
  const initialCentres = await getCentresWithContacts();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "36px", color: "var(--verd-fosc)", margin: 0, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            Gestió de Centres (CRM)
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontStyle: "normal", fontWeight: 700, backgroundColor: "rgba(217,87,56,0.1)", color: "#d95738", padding: "4px 12px", borderRadius: "99px", border: "1px solid rgba(217,87,56,0.2)" }}>
              <ShieldCheck size={14} /> Admin
            </span>
          </h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", marginTop: "6px", margin: 0 }}>
            Administra els contactes, adreces, telèfons, webs i persones de contacte de tots els centres. Consulta i edita les seves activitats extraescolars.
          </p>
        </div>
      </div>

      {/* Info notice about Airtable sync */}
      <div style={{ 
        marginBottom: "24px", 
        padding: "14px 20px", 
        backgroundColor: "white", 
        borderRadius: "12px", 
        border: "1px solid var(--verd-pallid)", 
        display: "flex", 
        alignItems: "center", 
        gap: "10px", 
        fontSize: "13.5px", 
        color: "var(--muted)" 
      }}>
        <Info size={16} style={{ color: "var(--verd)", flexShrink: 0 }} />
        <span>
          <strong>Sincronització en Temps Real:</strong> Qualsevol canvi que realitzis en les dades dels centres o les seves activitats s'actualitzarà immediatament a Airtable.
        </span>
      </div>

      {/* CRM Interactive workspace */}
      <CRMClient 
        initialCentres={initialCentres} 
      />
    </div>
  );
}
