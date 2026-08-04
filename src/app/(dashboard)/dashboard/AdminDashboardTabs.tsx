/* eslint-disable */
"use client";

import React, { useState } from "react";
import { Building, Activity, Tag, Sun, Award, Users, MapPin, BarChart2 } from "lucide-react";
import AdminCentresTab from "./AdminCentresTab";
import ActivitatsTable from "./ActivitatsTable";
import AdminMoreTabs from "./AdminMoreTabs";
import RefreshCacheButton from "./RefreshCacheButton";
import { CRMCentre } from "@/lib/crm";
import { Activitat } from "@/lib/types";

interface AdminDashboardTabsProps {
  initialCentres: CRMCentre[];
  activitats: Activitat[];
  poblacions: Record<string, string[]>;
  initialCentreId?: string;
  initialCategories?: any[];
  initialSubcategories?: any[];
  initialCasals?: any[];
  initialSponsors?: any[];
  initialUsuaris?: any[];
  initialPoblacionsList?: any[];
  initialAnalytics?: any[];
}

type TabType = "centres" | "activitats" | "categories" | "casals" | "sponsors" | "usuaris" | "poblacions" | "analytics";

export default function AdminDashboardTabs({ 
  initialCentres, 
  activitats, 
  poblacions,
  initialCentreId,
  initialCategories = [],
  initialSubcategories = [],
  initialCasals = [],
  initialSponsors = [],
  initialUsuaris = [],
  initialPoblacionsList = [],
  initialAnalytics = []
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("centres");

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "centres", label: "Centres", icon: <Building size={16} /> },
    { id: "activitats", label: "Activitats", icon: <Activity size={16} /> },
    { id: "categories", label: "Categories", icon: <Tag size={16} /> },
    { id: "casals", label: "Casals", icon: <Sun size={16} /> },
    { id: "sponsors", label: "Sponsors", icon: <Award size={16} /> },
    { id: "usuaris", label: "Usuaris Centres", icon: <Users size={16} /> },
    { id: "poblacions", label: "Poblacions", icon: <MapPin size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={16} /> },
  ];

  return (
    <div>
      {/* Selector de Pestanyes Administratiu Complet */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        borderBottom: "1.5px solid var(--crema-fosca)", 
        marginBottom: "30px", 
        paddingBottom: "4px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "none",
                background: "none",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                cursor: "pointer",
                color: activeTab === t.id ? "var(--verd-fosc)" : "var(--muted)",
                borderBottom: activeTab === t.id ? "3px solid var(--verd)" : "3px solid transparent",
                transition: "all 0.2s",
                marginBottom: "-6px"
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Botó d'actualització de memòria cau */}
        <div style={{ marginBottom: "6px" }}>
          <RefreshCacheButton />
        </div>
      </div>

      {/* Renderitzat de la pestanya activa */}
      {activeTab === "centres" && (
        <AdminCentresTab 
          initialCentres={initialCentres} 
          poblacions={poblacions}
          initialCentreId={initialCentreId}
        />
      )}

      {activeTab === "activitats" && (
        <ActivitatsTable 
          activitats={activitats} 
          isAdmin={true} 
        />
      )}

      {activeTab !== "centres" && activeTab !== "activitats" && (
        <AdminMoreTabs 
          tab={activeTab} 
          initialCategories={initialCategories}
          initialSubcategories={initialSubcategories}
          initialCasals={initialCasals}
          initialSponsors={initialSponsors}
          initialUsuaris={initialUsuaris}
          initialPoblacions={initialPoblacionsList}
          initialAnalytics={initialAnalytics}
          centres={initialCentres}
        />
      )}
    </div>
  );
}
