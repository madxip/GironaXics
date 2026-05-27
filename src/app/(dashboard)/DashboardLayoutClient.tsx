"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import SignOutButton from "./SignOutButton";
import DashboardNav from "./DashboardNav";

interface DashboardLayoutClientProps {
  centreNom: string;
  userEmail: string;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  centreNom,
  userEmail,
  children,
}: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Tancar el menú lateral quan canvia la pàgina (mòbil)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Evitar el desplaçament del fons de pantalla quan el menú de mòbil està obert
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "#f7f9f6",
      color: "var(--fosc)",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
      width: "100%"
    }}>
      {/* Capçalera fixa superior per a mòbils */}
      <header className="dashboard-mobile-header">
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--verd-fosc)",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Obrir menú de navegació"
        >
          <Menu size={24} />
        </button>

        <Link href="/" style={{ textDecoration: "none", fontSize: "20px" }} className="logo">
          <span>Girona</span><span>Xics</span>
        </Link>

        {/* Cercle amb la inicial del centre a la dreta de la capçalera de mòbil */}
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: "var(--crema-fosca)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--verd-fosc)",
          fontWeight: 700,
          fontSize: "14px",
          border: "2px solid var(--verd-pallid)"
        }}>
          {centreNom.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Teló posterior fosc per tancar el menú en mòbils */}
      {isSidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menú lateral drawer responsiu */}
      <aside className={`dashboard-aside ${isSidebarOpen ? "open" : ""}`}>
        <div>
          {/* Logo i Botó de tancar (només visible en mòbil) */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "40px"
          }}>
            <div>
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

            {/* Botó de tancar estil creu en mòbils */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "4px"
              }}
              className="dashboard-mobile-close-btn"
              aria-label="Tancar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Enllaços de navegació del Dashboard */}
          <DashboardNav />
        </div>

        {/* Perfil d'usuari i Botó de Sortir al final de la barra lateral */}
        <div style={{
          borderTop: "1px solid var(--crema-fosca)",
          paddingTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          {/* Dades del perfil */}
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
              border: "2px solid var(--verd-pallid)",
              flexShrink: 0
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
                {userEmail}
              </div>
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Contenidor de contingut principal adaptable */}
      <main className="dashboard-content">
        {children}
      </main>

      {/* Estils locals de suport per amagar de manera nativa la creu de tancar en escriptori */}
      <style jsx global>{`
        .dashboard-mobile-close-btn {
          display: none !important;
        }
        @media (max-width: 1024px) {
          .dashboard-mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
