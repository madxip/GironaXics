"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Activitat } from "@/lib/types";

interface ActivityFormProps {
  initialData?: Activitat;
  categories: string[];
  barris: string[];
  submitAction: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
}

export default function ActivityForm({
  initialData,
  categories,
  barris,
  submitAction,
  title
}: ActivityFormProps) {
  const router = useRouter();

  const [nom, setNom] = useState(initialData?.nom || "");
  const [barri, setBarri] = useState(initialData?.barri || "");
  const [categoria, setCategoria] = useState(initialData?.categoria || "");
  const [edat, setEdat] = useState(initialData?.edat || "");
  const [preu, setPreu] = useState(initialData?.preu !== undefined ? String(initialData.preu) : "");
  const [horari, setHorari] = useState(initialData?.horari || "");
  const [dies, setDies] = useState(initialData?.dies || "");
  const [descripcio, setDescripcio] = useState(initialData?.descripcio || "");
  const [durada, setDurada] = useState(initialData?.durada || "");
  const [alumnes, setAlumnes] = useState(initialData?.alumnes || "");
  const [material, setMaterial] = useState(initialData?.material || "");
  const [inici, setInici] = useState(initialData?.inici || "");
  const [idioma, setIdioma] = useState(initialData?.idioma || "");
  const [qui_imparteix, setQuiImparteix] = useState(initialData?.qui_imparteix || "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!nom || !barri || !categoria || !edat || !horari || !dies) {
      setErrorMsg("Si us plau, omple tots els camps obligatoris marcats amb asterisc (*).");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("barri", barri);
      formData.append("categoria", categoria);
      formData.append("edat", edat);
      formData.append("preu", preu);
      formData.append("horari", horari);
      formData.append("dies", dies);
      formData.append("descripcio", descripcio);
      formData.append("durada", durada);
      formData.append("alumnes", alumnes);
      formData.append("material", material);
      formData.append("inici", inici);
      formData.append("idioma", idioma);
      formData.append("qui_imparteix", qui_imparteix);

      const res = await submitAction(null, formData);

      if (res && !res.success) {
        setErrorMsg(res.error || "No s'ha pogut desar l'activitat.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("[Form Submit Error]", err);
      setErrorMsg("S'ha produït un error de xarxa o inesperat.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Back link */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/dashboard" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--muted)",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
          transition: "color 0.2s"
        }}
        className="back-btn"
        >
          <ArrowLeft size={16} />
          Tornar a les meves activitats
        </Link>
      </div>

      {/* Card Wrapper */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        border: "1px solid var(--verd-pallid)",
        boxShadow: "0 10px 30px rgba(26, 107, 58, 0.02)",
        padding: "40px"
      }}>
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "30px",
          color: "var(--verd-fosc)",
          marginBottom: "8px"
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: "14px",
          color: "var(--muted)",
          marginBottom: "32px"
        }}>
          Omple els detalls de l'activitat extraescolar per publicar-la a la guia.
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: "#FCE8E6",
            border: "1px solid #F5C2C2",
            color: "#C53929",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "14px",
            marginBottom: "32px",
            lineHeight: "1.5"
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Section 1: Informació Bàsica */}
          <div>
            <h3 style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--verd)",
              borderBottom: "1px solid var(--crema-fosca)",
              paddingBottom: "8px",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              1. Informació Bàsica
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Nom de l'Activitat *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Taller de Robòtica Educativa, Anglès extraescolar..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    width: "100%",
                    color: "var(--fosc)"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--fosc)",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">-- Tria una categoria --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Barri de Girona *
                </label>
                <select
                  value={barri}
                  onChange={(e) => setBarri(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--fosc)",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">-- Tria un barri --</option>
                  {barris.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Horari, Dies i Edat */}
          <div>
            <h3 style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--verd)",
              borderBottom: "1px solid var(--crema-fosca)",
              paddingBottom: "8px",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              2. Horari, Preu i Edats
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Dies *
                </label>
                <input
                  type="text"
                  value={dies}
                  onChange={(e) => setDies(e.target.value)}
                  placeholder="Ex: Dilluns i Dimecres, Dissabtes matí..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Horari *
                </label>
                <input
                  type="text"
                  value={horari}
                  onChange={(e) => setHorari(e.target.value)}
                  placeholder="Ex: 17:00 a 18:30"
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Franja d'Edats *
                </label>
                <input
                  type="text"
                  value={edat}
                  onChange={(e) => setEdat(e.target.value)}
                  placeholder="Ex: 6 a 12 anys, P3 a P5..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Preu (€ mensuals)
                </label>
                <input
                  type="number"
                  value={preu}
                  onChange={(e) => setPreu(e.target.value)}
                  placeholder="Ex: 45 (deixar buit si no aplica)"
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Més Informació i Detalls */}
          <div>
            <h3 style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--verd)",
              borderBottom: "1px solid var(--crema-fosca)",
              paddingBottom: "8px",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              3. Detalls de l'Activitat
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Descripció detallada
                </label>
                <textarea
                  value={descripcio}
                  onChange={(e) => setDescripcio(e.target.value)}
                  placeholder="Explica què faran els xics en aquesta activitat, quina metodologia es fa servir, beneficis, etc."
                  disabled={loading}
                  rows={4}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "var(--fosc)",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Durada de la sessió
                  </label>
                  <input
                    type="text"
                    value={durada}
                    onChange={(e) => setDurada(e.target.value)}
                    placeholder="Ex: 1h 30min"
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Ràtio d'alumnes
                  </label>
                  <input
                    type="text"
                    value={alumnes}
                    onChange={(e) => setAlumnes(e.target.value)}
                    placeholder="Ex: Màxim 12 xics per grup"
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Material
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Ex: Ordinadors inclosos, cal portar llibreta..."
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Data d'Inici
                  </label>
                  <input
                    type="text"
                    value={inici}
                    onChange={(e) => setInici(e.target.value)}
                    placeholder="Ex: 1 d'Octubre, Setembre..."
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Idioma
                  </label>
                  <input
                    type="text"
                    value={idioma}
                    onChange={(e) => setIdioma(e.target.value)}
                    placeholder="Ex: Català, Anglès..."
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    Qui ho imparteix?
                  </label>
                  <input
                    type="text"
                    value={qui_imparteix}
                    onChange={(e) => setQuiImparteix(e.target.value)}
                    placeholder="Ex: Professors natius, Entrenadors titulats..."
                    disabled={loading}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid rgba(26, 107, 58, 0.2)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      outline: "none",
                      color: "var(--fosc)"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "16px",
            borderTop: "1px solid var(--crema-fosca)",
            paddingTop: "28px",
            marginTop: "12px"
          }}>
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "1px solid rgba(26, 107, 58, 0.2)",
                color: "var(--verd)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Cancel·lar
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--verd)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 28px",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                opacity: loading ? 0.8 : 1
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = "var(--verd-fosc)")}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = "var(--verd)")}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardant...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Desar Canvis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
