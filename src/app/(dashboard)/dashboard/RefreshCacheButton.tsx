"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshCacheAction } from "@/app/actions/cache";

export default function RefreshCacheButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleRefresh = async () => {
    setLoading(true);
    setStatus("idle");
    const res = await refreshCacheAction();
    setLoading(false);
    setStatus(res.success ? "ok" : "error");
    if (res.success) {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title="Invalida la memòria cau i força la re-renderització de totes les pàgines"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: status === "ok" ? "rgba(26,107,58,0.08)" : "white",
        color: status === "ok" ? "var(--verd)" : status === "error" ? "#b91c1c" : "var(--muted)",
        border: `1px solid ${status === "ok" ? "rgba(26,107,58,0.3)" : status === "error" ? "rgba(185,28,28,0.3)" : "var(--verd-pallid)"}`,
        padding: "8px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s",
      }}
    >
      <RefreshCw
        size={14}
        style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
      />
      {loading
        ? "Actualitzant..."
        : status === "ok"
        ? "✓ Dades actualitzades"
        : status === "error"
        ? "Error al actualitzar"
        : "Actualitzar dades"}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
