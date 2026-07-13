"use client";

import React, { useState } from "react";
import { Building, Activity } from "lucide-react";
import AdminCentresTab from "./AdminCentresTab";
import ActivitatsTable from "./ActivitatsTable";
import RefreshCacheButton from "./RefreshCacheButton";
import { CRMCentre } from "@/lib/crm";
import { Activitat } from "@/lib/types";

interface AdminDashboardTabsProps {
  initialCentres: CRMCentre[];
  activitats: Activitat[];
  poblacions: Record<string, string[]>;
  initialCentreId?: string;
}

export default function AdminDashboardTabs({ 
  initialCentres, 
  activitats, 
  poblacions,
  initialCentreId
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"centres" | "activitats">("centres");

  return (
    <div>
      {/* Selector de Pestanyes Premium */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        borderBottom: "1.5px solid var(--crema-fosca)", 
        marginBottom: "30px", 
        paddingBottom: "4px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveTab("centres")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              border: "none",
              background: "none",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              cursor: "pointer",
              color: activeTab === "centres" ? "var(--verd-fosc)" : "var(--muted)",
              borderBottom: activeTab === "centres" ? "3px solid var(--verd)" : "3px solid transparent",
              transition: "all 0.2s",
              marginBottom: "-6px"
            }}
          >
            <Building size={18} /> Centres de GironaXics
          </button>
          <button
            onClick={() => setActiveTab("activitats")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              border: "none",
              background: "none",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              cursor: "pointer",
              color: activeTab === "activitats" ? "var(--verd-fosc)" : "var(--muted)",
              borderBottom: activeTab === "activitats" ? "3px solid var(--verd)" : "3px solid transparent",
              transition: "all 0.2s",
              marginBottom: "-6px"
            }}
          >
            <Activity size={18} /> Totes les Activitats
          </button>
        </div>

        {/* Botó d'actualització de memòria cau exclusiu de l'admin */}
        <div style={{ marginBottom: "6px" }}>
          <RefreshCacheButton />
        </div>
      </div>

      {/* Contingut segons la pestanya activa */}
      {activeTab === "centres" ? (
        <AdminCentresTab 
          initialCentres={initialCentres} 
          poblacions={poblacions}
          initialCentreId={initialCentreId}
        />
      ) : (
        <ActivitatsTable 
          activitats={activitats} 
          isAdmin={true} 
        />
      )}
    </div>
  );
}
