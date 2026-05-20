import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCentres } from "@/lib/airtable";
import { Plus, Activity, Globe, Building } from "lucide-react";
import SignOutButton from "./SignOutButton";

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

  // Get center name to display in the dashboard
  const centres = await getCentres();
  const userCentre = centres.find(c => c.id === session.user.centreId);
  const centreNom = userCentre ? userCentre.nom : "El teu Centre";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "#f7f9f6",
      color: "var(--fosc)",
      fontFamily: "var(--font-sans, system-ui, sans-serif)"
    }}>
      {/* Sidebar */}
      <aside style={{
        width: "280px",
        backgroundColor: "white",
        borderRight: "1px solid var(--verd-pallid)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 24px",
        position: "fixed",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 100
      }}>
        <div>
          {/* Logo */}
          <div style={{ marginBottom: "40px" }}>
            <Link href="/" style={{ textDecoration: "none" }} className="logo">
              <span>Girona</span><span>Xics</span>
            </Link>
            <div style={{
              fontSize: "12px",
              color: "var(--verd)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: "4px",
              paddingLeft: "4px"
            }}>
              Panell de Gestió
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: "var(--verd-fosc)",
                backgroundColor: "rgba(26, 107, 58, 0.05)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "15px",
                transition: "all 0.2s"
              }}
            >
              <Activity size={18} />
              Les meves Activitats
            </Link>

            <Link
              href="/dashboard/centre"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: "var(--muted)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "15px",
                transition: "all 0.2s"
              }}
              className="dashboard-nav-link"
            >
              <Building size={18} />
              Dades del Centre
            </Link>

            <Link
              href="/dashboard/activitats/nova"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: "var(--muted)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "15px",
                transition: "all 0.2s"
              }}
              className="dashboard-nav-link"
            >
              <Plus size={18} />
              Afegir Activitat
            </Link>

            <Link
              href="/"
              target="_blank"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                color: "var(--muted)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "15px",
                transition: "all 0.2s"
              }}
              className="dashboard-nav-link"
            >
              <Globe size={18} />
              Veure Web Pública
            </Link>
          </nav>
        </div>

        {/* User profile / Logout */}
        <div style={{
          borderTop: "1px solid var(--crema-fosca)",
          paddingTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: "var(--crema-fosca)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--verd-fosc)",
              fontWeight: 700,
              fontSize: "16px",
              border: "2px solid var(--verd-pallid)"
            }}>
              {centreNom.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--verd-fosc)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {centreNom}
              </div>
              <div style={{
                fontSize: "12px",
                color: "var(--muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {session.user.email}
              </div>
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div style={{
        marginLeft: "280px",
        flex: 1,
        padding: "48px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}>
        {children}
      </div>
    </div>
  );
}
