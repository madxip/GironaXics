"use client";

import React, { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "@/app/actions/password";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid rgba(26, 107, 58, 0.2)",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  backgroundColor: "white",
  color: "var(--fosc)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--verd-fosc)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: "6px",
};

function PasswordField({ id, name, label }: { id: string; name: string; label: string }) {
  const { pending } = useFormStatus();
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="off"
          disabled={pending}
          style={{ ...inputStyle, paddingRight: "44px" }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ width: "100%", backgroundColor: "var(--verd)", color: "white", border: "none", borderRadius: "8px", padding: "14px", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "17px", cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.8 : 1, transition: "background-color 0.2s" }}
    >
      {pending ? "Actualitzant..." : "Canviar contrasenya"}
    </button>
  );
}

export default function CompteClient() {
  const [state, formAction] = useFormState(changePasswordAction, null);

  return (
    <div style={{ maxWidth: "520px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "rgba(26,107,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Lock size={20} color="var(--verd)" />
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "28px", color: "var(--verd-fosc)", margin: 0 }}>
          Canviar contrasenya
        </h1>
      </div>
      <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "32px" }}>
        Introdueix la teva contrasenya actual i la nova contrasenya.
      </p>

      {state?.success && (
        <div role="status" style={{ backgroundColor: "#E6F4EA", border: "1px solid #CEEAD6", color: "#137333", padding: "14px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
          {state.message}
          <div style={{ marginTop: "12px" }}>
            <Link href="/dashboard" style={{ color: "#137333", fontWeight: 700 }}>Tornar al panell</Link>
          </div>
        </div>
      )}

      {state?.success === false && state.error && (
        <div role="alert" style={{ backgroundColor: "#FCE8E6", border: "1px solid #F5C2C2", color: "#C53929", padding: "14px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
          {state.error}
        </div>
      )}

      {!state?.success && (
        <form action={formAction} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid var(--crema-fosca)", padding: "28px" }}>
          <PasswordField id="compte-current" name="currentPassword" label="Contrasenya actual" />
          <PasswordField id="compte-new" name="newPassword" label="Nova contrasenya" />
          <PasswordField id="compte-confirm" name="confirmPassword" label="Confirmar nova contrasenya" />
          <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px" }}>
            Mínim 8 caràcters.
          </p>
          <SubmitButton />
        </form>
      )}

      <div style={{ marginTop: "20px" }}>
        <Link href="/dashboard" style={{ fontSize: "14px", color: "var(--muted)", textDecoration: "none" }}>
          ← Tornar al panell
        </Link>
      </div>
    </div>
  );
}
