import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getActivitatsByCentreId, getAllActivitats, getCentres } from "@/lib/airtable";
import Link from "next/link";
import { Plus, Activity, ShieldCheck, Info } from "lucide-react";
import ActivitatsTable from "./ActivitatsTable";
import RefreshCacheButton from "./RefreshCacheButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  const centreId = session.user.centreId;
  const isAdmin = session.user.isAdmin;

  // Admin veu TOTES les activitats (publicades + no publicades); els centres només les seves
  const activitats = isAdmin
    ? await getAllActivitats()
    : await getActivitatsByCentreId(centreId);

  const publicadesCount = isAdmin ? activitats.filter(a => a.publicada).length : activitats.length;

  const centres = await getCentres();
  const userCentre = centres.find(c => c.id === centreId);
  const centreNom = isAdmin ? "Administrador" : (userCentre ? userCentre.nom : "El teu Centre");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "36px", color: "var(--verd-fosc)", margin: 0, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {isAdmin ? "Totes les Activitats" : `Benvingut, ${centreNom}`}
            {isAdmin && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontStyle: "normal", fontWeight: 700, backgroundColor: "rgba(217,87,56,0.1)", color: "#d95738", padding: "4px 12px", borderRadius: "99px", border: "1px solid rgba(217,87,56,0.2)" }}>
                <ShieldCheck size={14} /> Admin
              </span>
            )}
          </h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", marginTop: "6px", margin: 0 }}>
            {isAdmin
              ? `${activitats.length} activitats en total · ${publicadesCount} publicades · ${activitats.length - publicadesCount} esborranys`
              : "Aquí pots crear, editar o eliminar les activitats extraescolars que ofereix el teu centre."
            }
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {isAdmin && <RefreshCacheButton />}
          <Link
            href="/dashboard/activitats/nova"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "var(--verd)", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "15px", fontFamily: "var(--font-serif)", fontStyle: "italic", boxShadow: "0 4px 12px rgba(26,107,58,0.15)", transition: "all 0.2s" }}
            className="dashboard-primary-btn"
          >
            <Plus size={18} />
            Afegir Activitat
          </Link>
        </div>
      </div>

      {/* Contingut principal */}
      {activitats.length === 0 ? (
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", padding: "60px 40px", textAlign: "center", boxShadow: "0 10px 30px rgba(26,107,58,0.02)", maxWidth: "600px", margin: "40px auto 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(26,107,58,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--verd)", margin: "0 auto 24px" }}>
            <Activity size={32} />
          </div>
          <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "24px", color: "var(--verd-fosc)", marginBottom: "12px" }}>
            Cap activitat registrada encara
          </h3>
          <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: "1.6", marginBottom: "32px" }}>
            El teu centre encara no té cap activitat extraescolar registrada. Comença ara mateix afegint la primera activitat perquè les famílies de Girona la puguin conèixer.
          </p>
          <Link href="/dashboard/activitats/nova" style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "var(--verd)", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "15px", fontFamily: "var(--font-serif)", fontStyle: "italic", transition: "all 0.2s" }} className="dashboard-primary-btn">
            <Plus size={18} /> Crea la teva primera activitat
          </Link>
        </div>
      ) : (
        <>
          <ActivitatsTable activitats={activitats} isAdmin={isAdmin} />
          <div style={{ marginTop: "16px", padding: "14px 20px", backgroundColor: "white", borderRadius: "12px", border: "1px solid var(--verd-pallid)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)" }}>
            <Info size={14} style={{ color: "var(--verd)", flexShrink: 0 }} />
            <span>
              {isAdmin
                ? "Els canvis via panell s'apliquen immediatament. Si has modificat dades directament a Airtable, fes servir el botó \"Actualitzar dades\"."
                : "Els canvis que realitzis es veuran reflectits de manera instantània a la pàgina web pública."}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
