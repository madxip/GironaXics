"use client";

import React, { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/password";

type ForgotPasswordState = {
  success?: boolean;
  message?: string;
  error?: string;
} | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        marginTop: "12px",
        backgroundColor: "var(--verd)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "16px",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: "18px",
        cursor: pending ? "not-allowed" : "pointer",
        transition: "background-color 0.2s",
        opacity: pending ? 0.8 : 1,
        width: "100%"
      }}
    >
      {pending ? "Enviant..." : "Envia l'enllaç de restabliment"}
    </button>
  );
}

function ForgotPasswordForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, null);

  return (
    <div>
      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: "28px",
        color: "var(--verd-fosc)",
        marginBottom: "8px",
        textAlign: "center"
      }}>
        He oblidat la contrasenya
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--muted)",
        textAlign: "center",
        marginBottom: "32px"
      }}>
        Introdueix el teu correu i t&apos;enviarem un enllaç per restablir-la.
      </p>

      {/* Success message */}
      {state?.success === true && state.message && (
        <div role="status" aria-live="polite" style={{
          backgroundColor: "#E6F4EA",
          border: "1px solid #CEEAD6",
          color: "#137333",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: "1.5"
        }}>
          {state.message}
        </div>
      )}

      {/* Error message */}
      {state?.success === false && state.error && (
        <div role="alert" style={{
          backgroundColor: "#FCE8E6",
          border: "1px solid #F5C2C2",
          color: "#C53929",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: "1.5"
        }}>
          {state.error}
        </div>
      )}

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="forgot-email" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Correu Electrònic
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            placeholder="el-teu-email@centre.com"
            autoComplete="email"
            required
            style={{
              padding: "14px",
              border: "1px solid rgba(26, 107, 58, 0.2)",
              borderRadius: "8px",
              fontSize: "15px",
              outline: "none",
              backgroundColor: "white",
              color: "var(--fosc)"
            }}
          />
        </div>
        <SubmitButton />
      </form>

      <div style={{
        marginTop: "32px",
        textAlign: "center",
        fontSize: "14px",
        color: "var(--muted)",
        borderTop: "1px solid var(--crema-fosca)",
        paddingTop: "24px"
      }}>
        <Link href="/login" style={{
          color: "var(--verd)",
          fontWeight: 700,
          textDecoration: "none"
        }}>
          ← Tornar a iniciar sessió
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <title>He oblidat la contrasenya — GironaXics</title>
      <Suspense fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <p style={{ color: "var(--muted)" }}>Carregant...</p>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </>
  );
}
