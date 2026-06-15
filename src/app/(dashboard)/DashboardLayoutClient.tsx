"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import SignOutButton from "./SignOutButton";
import DashboardNav from "./DashboardNav";
import Toast from "@/components/Toast";

function DashboardToastListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      let message = "";
      if (success === "created") {
        message = "L'activitat s'ha creat correctament!";
      } else if (success === "updated") {
        message = "L'activitat s'ha actualitzat correctament!";
      } else if (success === "deleted") {
        message = "L'activitat s'ha eliminat correctament!";
      }

      if (message) {
        setToast({ type: "success", message });
        
        // Remove success query parameter from URL cleanly without page reload
        const params = new URLSearchParams(searchParams.toString());
        params.delete("success");
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl);
      }
    }
  }, [searchParams, router, pathname]);

  if (!toast) return null;

  return (
    <div className="dashboard-toast-container">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(null)}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          width: calc(100% - 48px);
          max-width: 420px;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .dashboard-toast-container {
            top: 16px;
            right: 16px;
            left: 16px;
            width: auto;
            max-width: none;
          }
        }
      `}} />
    </div>
  );
}


interface DashboardLayoutClientProps {
  centreNom: string;
  userEmail: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  centreNom,
  userEmail,
  isAdmin = false,
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
      <Suspense fallback={null}>
        <DashboardToastListener />
      </Suspense>
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
          <DashboardNav isAdmin={isAdmin} />
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
              backgroundColor: isAdmin ? "rgba(217,87,56,0.12)" : "var(--crema-fosca)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isAdmin ? "#d95738" : "var(--verd-fosc)",
              fontWeight: 700,
              fontSize: "16px",
              border: isAdmin ? "2px solid rgba(217,87,56,0.3)" : "2px solid var(--verd-pallid)",
              flexShrink: 0
            }}>
              {isAdmin ? "★" : centreNom.charAt(0).toUpperCase()}
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
                color: isAdmin ? "#d95738" : "var(--muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: isAdmin ? 600 : 400
              }}>
                {isAdmin ? "👑 Administrador" : userEmail}
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
