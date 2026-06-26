"use client";

import React, { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/password";

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
      {pending ? "Establint contrasenya..." : "Establir nova contrasenya"}
    </button>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, formAction] = useFormState(resetPasswordAction, null);

  // No token: show error
  if (!token) {
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
          Restablir contrasenya
        </h2>

        <div role="alert" style={{
          backgroundColor: "#FCE8E6",
          border: "1px solid #F5C2C2",
          color: "#C53929",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: "1.5",
          marginTop: "32px"
        }}>
          L&apos;enllaç de restabliment no és vàlid. Sol·licita&apos;n un de nou.
        </div>

        <div style={{
          marginTop: "32px",
          textAlign: "center",
          fontSize: "14px",
          color: "var(--muted)",
          borderTop: "1px solid var(--crema-fosca)",
          paddingTop: "24px"
        }}>
          <Link href="/forgot-password" style={{
            color: "var(--verd)",
            fontWeight: 700,
            textDecoration: "none"
          }}>
            ← Sol·licitar un nou enllaç
          </Link>
        </div>
      </div>
    );
  }

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
        Restablir contrasenya
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--muted)",
        textAlign: "center",
        marginBottom: "32px"
      }}>
        Introdueix la teva nova contrasenya.
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
          {state.message}{" "}
          <Link href="/login" style={{
            color: "#137333",
            fontWeight: 700,
            textDecoration: "underline"
          }}>
            Inicia sessió
          </Link>
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
        {/* Hidden token field */}
        <input type="hidden" name="token" value={token} />

        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="reset-password" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Nova contrasenya
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
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

        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="reset-password-confirm" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Confirmar nova contrasenya
          </label>
          <input
            id="reset-password-confirm"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
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

export default function ResetPasswordPage() {
  return (
    <>
      <title>Restablir contrasenya — GironaXics</title>
      <Suspense fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <p style={{ color: "var(--muted)" }}>Carregant...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
