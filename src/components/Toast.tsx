"use client";

import React, { useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTheme = () => {
    switch (type) {
      case "success":
        return {
          bg: "rgba(240, 253, 244, 0.92)",
          border: "rgba(34, 197, 94, 0.3)",
          color: "#15803d", // Vibrant text color
          icon: <CheckCircle2 size={18} style={{ color: "#22c55e", flexShrink: 0 }} />,
        };
      case "error":
        return {
          bg: "rgba(254, 242, 242, 0.92)",
          border: "rgba(239, 68, 68, 0.3)",
          color: "#b91c1c", // Vibrant error text color
          icon: <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />,
        };
      case "info":
      default:
        return {
          bg: "rgba(240, 249, 255, 0.92)",
          border: "rgba(56, 189, 248, 0.3)",
          color: "#0369a1", // Vibrant info text color
          icon: <Info size={18} style={{ color: "#0ea5e9", flexShrink: 0 }} />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 18px",
        borderRadius: "12px",
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.color,
        boxShadow: "0 10px 25px -5px rgba(26, 107, 58, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        maxWidth: "420px",
        width: "100%",
        fontSize: "14px",
        fontWeight: 600,
        lineHeight: "1.4",
        pointerEvents: "auto",
        animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
      className="floating-toast-card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        {theme.icon}
        <span style={{ fontSize: "14px", letterSpacing: "-0.01em" }}>{message}</span>
      </div>

      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          opacity: 0.6,
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          transition: "all 0.2s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = "0.6";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        aria-label="Tancar avís"
      >
        <X size={16} />
      </button>

      {/* Slide in animation block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastSlideIn {
          from {
            transform: translateY(-16px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}
