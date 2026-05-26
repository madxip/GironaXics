"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerCentreAction } from "@/app/actions/auth";
import { Centre } from "@/lib/types";

interface RegisterFormProps {
  centres: Centre[];
}

export default function RegisterForm({ centres }: RegisterFormProps) {
  const router = useRouter();
  
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [centreId, setCentreId] = useState("");
  const [nouCentreNom, setNouCentreNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!nom || !email || !password || !centreId) {
      setErrorMsg("Si us plau, omple tots els camps del formulari.");
      setLoading(false);
      return;
    }

    if (centreId === "nou-centre" && !nouCentreNom) {
      setErrorMsg("Si us plau, escriu el nom del nou centre.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("centreId", centreId);
      if (centreId === "nou-centre") {
        formData.append("nouCentreNom", nouCentreNom);
      }

      const res = await registerCentreAction(null, formData);

      if (res && !res.success) {
        setErrorMsg(res.error || "S'ha produït un error al registrar el compte.");
        setLoading(false);
      } else {
        // Redirect to login with a registered success query parameter
        router.push("/login?registered=true");
      }
    } catch (err) {
      console.error("[Register Error]", err);
      setErrorMsg("S'ha produït un error de xarxa o inesperat. Torna-ho a provar.");
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
        Registra el teu Centre
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--muted)",
        textAlign: "center",
        marginBottom: "32px"
      }}>
        Crea un compte d'accés per gestionar les teves activitats
      </p>

      {/* Error message */}
      {errorMsg && (
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
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="reg-nom" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Nom de Contacte
          </label>
          <input
            id="reg-nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="El teu nom i cognoms"
            autoComplete="name"
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
          <label htmlFor="reg-email" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Correu Electrònic
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correu@teucentre.com"
            autoComplete="email"
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
          <label htmlFor="reg-centre" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Selecciona el teu Centre
          </label>
          <select
            id="reg-centre"
            value={centreId}
            onChange={(e) => setCentreId(e.target.value)}
            disabled={loading}
            style={{
              padding: "14px",
              border: "1px solid rgba(26, 107, 58, 0.2)",
              borderRadius: "8px",
              fontSize: "15px",
              outline: "none",
              backgroundColor: "white",
              color: "var(--fosc)",
              cursor: "pointer"
            }}
          >
            <option value="">-- Selecciona el centre --</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
            <option value="nou-centre">-- El meu centre és nou (no surt a la llista) --</option>
          </select>
          <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
            Si el teu centre és nou, selecciona l'opció anterior per poder-ne crear la fitxa.
          </span>
        </div>

        {centreId === "nou-centre" && (
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="reg-nou-centre" style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "var(--verd-fosc)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Nom del Nou Centre
            </label>
            <input
              id="reg-nou-centre"
              type="text"
              value={nouCentreNom}
              onChange={(e) => setNouCentreNom(e.target.value)}
              placeholder="Ex: Activa't Gimnàs, Escola Bressol..."
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
        )}

        <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="reg-password" style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--verd-fosc)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Contrasenya
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínim 8 caràcters"
            autoComplete="new-password"
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
          {loading ? "Registrant..." : "Registrar-se"}
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
        Ja tens un compte?{" "}
        <Link href="/login" style={{
          color: "var(--verd)",
          fontWeight: 700,
          textDecoration: "none"
        }}>
          Inicia sessió aquí
        </Link>
      </div>
    </div>
  );
}
