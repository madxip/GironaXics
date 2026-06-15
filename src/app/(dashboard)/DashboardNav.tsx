"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Activity, Globe, Building, BarChart2, Users } from "lucide-react";

export default function DashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "Les meves Activitats",
      icon: Activity,
      exact: true
    },
    ...(isAdmin ? [
      {
        href: "/dashboard/crm",
        label: "Gestió de Centres (CRM)",
        icon: Users
      }
    ] : []),
    {
      href: "/dashboard/centre",
      label: "Dades del Centre",
      icon: Building
    },
    {
      href: "/dashboard/activitats/nova",
      label: "Afegir Activitat",
      icon: Plus
    },
    {
      href: "/dashboard/analytics",
      label: "Analítica",
      icon: BarChart2
    },
    {
      href: "/",
      label: "Veure Web Pública",
      icon: Globe,
      target: "_blank"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.href}
            href={link.href}
            target={link.target}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "8px",
              color: isActive ? "var(--verd-fosc)" : "var(--muted)",
              backgroundColor: isActive ? "rgba(26, 107, 58, 0.05)" : "transparent",
              textDecoration: "none",
              fontWeight: isActive ? 600 : 500,
              fontSize: "15px",
              transition: "all 0.2s"
            }}
            className="dashboard-nav-link"
          >
            <Icon size={18} />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
