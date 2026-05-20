"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "transparent",
        border: "1px solid rgba(220, 53, 69, 0.2)",
        color: "#dc3545",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = "#fff5f5";
        e.currentTarget.style.borderColor = "#dc3545";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "rgba(220, 53, 69, 0.2)";
      }}
    >
      <LogOut size={16} />
      Tancar Sessió
    </button>
  );
}
