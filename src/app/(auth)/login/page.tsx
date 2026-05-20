"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Capture redirection errors or messages from Next-Auth query params
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "CredentialsSignin") {
        setErrorMsg("Correu o contrasenya incorrectes.");
      } else if (errorParam === "not-approved") {
        setErrorMsg("El teu compte encara està pendent d'aprovació manual per part de l'administrador.");
      } else if (errorParam === "no-user") {
        setErrorMsg("Aquest correu no està registrat en cap centre.");
      } else if (errorParam === "wrong-password") {
        setErrorMsg("Contrasenya incorrecta.");
      } else {
        setErrorMsg("S'ha produït un error al iniciar sessió. Si us plau, torna-ho a provar.");
      }
    }

    const regSuccess = searchParams.get("registered");
    if (regSuccess) {
      setSuccessMsg("Registre correcte! El teu compte s'ha creat i està en espera d'aprovació manual de l'administrador.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Si us plau, omple tots els camps.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        // Next-auth custom authorize errors might trigger through direct param or inside res.error string
        if (res.error.includes("not-approved")) {
          setErrorMsg("El teu compte encara està pendent d'aprovació manual per part de l'administrador.");
        } else if (res.error.includes("no-user")) {
          setErrorMsg("Aquest correu no està registrat en cap centre.");
        } else if (res.error.includes("wrong-password") || res.error.includes("CredentialsSignin")) {
          setErrorMsg("Correu o contrasenya incorrectes.");
        } else {
          setErrorMsg("Correu o contrasenya incorrectes.");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("[Login Error]", err);
      setErrorMsg("S'ha produït un error inesperat. Torna-ho a provar.");
    } finally {
      setLoading(false);
    }
  };

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
        Inicia Sessió
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--muted)",
        textAlign: "center",
        marginBottom: "32px"
      }}>
        Gestió d'activitats extraescolars per a centres
      </p>

      {/* Error message */}
      {errorMsg && (
        <div style={{
          backgroundColor: "#FCE8E6",
          border: "1px solid #F5C2C2",
          color: "#C53929",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: "1.5"
        }}>
          {errorMsg}
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div style={{
          backgroundColor: "#E6F4EA",
          border: "1px solid #CEEAD6",
          color: "#137333",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: "1.5"
        }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Correu Electrònic
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="el-teu-email@centre.com"
            disabled={loading}
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
          <label style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Contrasenya
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
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

        <button
          type="submit"
          disabled={loading}
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
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            opacity: loading ? 0.8 : 1
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = "var(--verd-fosc)")}
          onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = "var(--verd)")}
        >
          {loading ? "Iniciant sessió..." : "Iniciar Sessió"}
        </button>
      </form>

      <div style={{
        marginTop: "32px",
        textAlign: "center",
        fontSize: "14px",
        color: "var(--muted)",
        borderTop: "1px solid var(--crema-fosca)",
        paddingTop: "24px"
      }}>
        El teu centre encara no té compte?{" "}
        <Link href="/registre" style={{
          color: "var(--verd)",
          fontWeight: 700,
          textDecoration: "none"
        }}>
          Registra't aquí
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <p style={{ color: "var(--muted)" }}>Carregant...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
