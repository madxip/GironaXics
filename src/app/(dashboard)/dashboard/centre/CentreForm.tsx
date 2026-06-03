"use client";

import React, { useState, useRef } from "react";
import { Centre } from "@/lib/types";
import { updateCentreAction } from "@/app/actions/centre";
import { Building, MapPin, Phone, Mail, Globe, Info, Loader2, Upload, Trash2 } from "lucide-react";
import { mapAirtableError } from "@/lib/utils";
import Toast from "@/components/Toast";

interface CentreFormProps {
  initialData: Centre;
  barris: { girona: string[]; altres: string[] };
}

export default function CentreForm({ initialData, barris }: CentreFormProps) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [barri, setBarri] = useState(initialData.barri || "");
  const [adreca, setAdreca] = useState(initialData.adreca || "");
  const [telefon, setTelefon] = useState(initialData.telefon || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [web, setWeb] = useState(initialData.web || "");
  const [descripcio, setDescripcio] = useState(initialData.descripcio || "");
  const [imatgeUrl, setImatgeUrl] = useState(initialData.imatgeUrl || "");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const handleFieldChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error en pujar el fitxer.");
      }

      const data = await res.json();
      if (data.url) {
        setImatgeUrl(data.url);
      } else {
        throw new Error(data.error || "No s'ha obtingut cap URL.");
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "No s'ha pogut pujar el logotip. Intenta-ho de nou." });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setImatgeUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const errors: Record<string, boolean> = {};
    if (!nom.trim()) errors.nom = true;
    if (!barri.trim()) errors.barri = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setMessage({
        type: "error",
        text: "Si us plau, omple tots els camps obligatoris marcats amb asterisc (*)."
      });
      
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => element.focus(), 100);
      }
      return;
    }

    setIsSubmitting(true);

    let formattedWeb = web.trim();
    if (formattedWeb && !/^https?:\/\//i.test(formattedWeb)) {
      formattedWeb = `https://${formattedWeb}`;
      setWeb(formattedWeb);
    }

    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("barri", barri);
    formData.append("adreca", adreca);
    formData.append("telefon", telefon);
    formData.append("email", email);
    formData.append("web", formattedWeb);
    formData.append("descripcio", descripcio);
    formData.append("imatgeUrl", imatgeUrl);

    try {
      const res = await updateCentreAction(null, formData);
      if (res.success) {
        setMessage({ type: "success", text: "Dades del centre actualitzades correctament!" });
      } else {
        const parsed = mapAirtableError(res.error);
        setMessage({ type: "error", text: parsed });
      }
    } catch (err) {
      console.error(err);
      const parsed = mapAirtableError(err);
      setMessage({ type: "error", text: parsed });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-serif, serif)",
          fontStyle: "italic",
          fontSize: "36px",
          color: "var(--verd-fosc)",
          margin: 0
        }}>
          Dades del Centre
        </h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", marginTop: "6px", margin: 0 }}>
          Mantén la informació de la teva entitat actualitzada perquè les famílies et puguin conèixer i contactar fàcilment.
        </p>
      </div>

      {message && (
        <div className="centre-toast-container">
          <Toast
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
          <style dangerouslySetInnerHTML={{ __html: `
            .centre-toast-container {
              position: fixed;
              top: 24px;
              right: 24px;
              z-index: 99999;
              width: calc(100% - 48px);
              max-width: 420px;
              pointer-events: none;
            }
            @media (max-width: 768px) {
              .centre-toast-container {
                top: 16px;
                right: 16px;
                left: 16px;
                width: auto;
                max-width: none;
              }
            }
          `}} />
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="dashboard-card-form"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px"
        }}
      >
        {/* Section 1: Basic Info */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif, serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--verd-fosc)",
            borderBottom: "1px solid var(--crema-fosca, #eae2d1)",
            paddingBottom: "8px",
            marginBottom: "20px",
            fontWeight: 600
          }}>
            1. INFORMACIÓ BÀSICA
          </h2>

          <div className="dashboard-grid-2">
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Nom del Centre *
              </label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => handleFieldChange("nom", e.target.value, setNom)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: validationErrors.nom 
                    ? "2.5px solid #b91c1c" 
                    : "1px solid var(--crema-fosca, #eae2d1)",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: validationErrors.nom ? "#fef2f2" : "white",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
              {validationErrors.nom && (
                <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                  * El nom del centre és obligatori
                </span>
              )}
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Barri / Municipi *
              </label>
              <select
                id="barri"
                value={barri}
                onChange={(e) => handleFieldChange("barri", e.target.value, setBarri)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: validationErrors.barri 
                    ? "2.5px solid #b91c1c" 
                    : "1px solid var(--crema-fosca, #eae2d1)",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  backgroundColor: validationErrors.barri ? "#fef2f2" : "white",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              >
                <option value="">-- Tria un barri o municipi --</option>
                <optgroup label="Barris de Girona">
                  {barris.girona.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
                {barris.altres.length > 0 && (
                  <optgroup label="Altres poblacions">
                    {barris.altres.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {validationErrors.barri && (
                <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                  * Selecciona un barri obligatori
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Logo */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif, serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--verd-fosc)",
            borderBottom: "1px solid var(--crema-fosca, #eae2d1)",
            paddingBottom: "8px",
            marginBottom: "20px",
            fontWeight: 600
          }}>
            2. LOGOTIP DEL CENTRE
          </h2>

          <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Image Preview Area */}
            <div style={{
              width: "140px",
              height: "140px",
              borderRadius: "12px",
              border: "2px dashed var(--crema-fosca, #eae2d1)",
              backgroundColor: "#fbfcfb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative"
            }}>
              {imatgeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imatgeUrl}
                  alt="Logotip previsualització"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px", boxSizing: "border-box" }}
                  onError={() => setImatgeUrl("")}
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: "12px" }}>
                  <Building size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <span style={{ fontSize: "11px", display: "block" }}>Sense Logo</span>
                </div>
              )}
              {isUploading && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Loader2 className="animate-spin" size={24} style={{ color: "var(--verd)" }} />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--verd)",
                    backgroundColor: "transparent",
                    color: "var(--verd)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  className="hoverable-btn"
                >
                  <Upload size={16} />
                  Puja Imatge
                </button>

                {imatgeUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isUploading || isSubmitting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #dc2626",
                      backgroundColor: "transparent",
                      color: "#dc2626",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                Format quadrat preferible (PNG, JPG). Mida màxima de 4MB.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Contact details */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif, serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--verd-fosc)",
            borderBottom: "1px solid var(--crema-fosca, #eae2d1)",
            paddingBottom: "8px",
            marginBottom: "20px",
            fontWeight: 600
          }}>
            3. DADES DE CONTACTE
          </h2>

          <div className="dashboard-grid-2">
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Adreça física
              </label>
              <div style={{ position: "relative" }}>
                <MapPin size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--muted)" }} />
                <input
                  type="text"
                  value={adreca}
                  onChange={(e) => setAdreca(e.target.value)}
                  placeholder="Carrer de l'Escola, 12, Girona"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--crema-fosca, #eae2d1)",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Telèfon
              </label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--muted)" }} />
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="972 00 00 00"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--crema-fosca, #eae2d1)",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Email públic de contacte
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--muted)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@teucentre.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--crema-fosca, #eae2d1)",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                Pàgina Web
              </label>
              <div style={{ position: "relative" }}>
                <Globe size={16} style={{ position: "absolute", left: "14px", top: "15px", color: "var(--muted)" }} />
                <input
                  type="text"
                  value={web}
                  onChange={(e) => setWeb(e.target.value)}
                  placeholder="gironaxics.cat o https://www.teucentre.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid var(--crema-fosca, #eae2d1)",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Description */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-serif, serif)",
            fontStyle: "italic",
            fontSize: "20px",
            color: "var(--verd-fosc)",
            borderBottom: "1px solid var(--crema-fosca, #eae2d1)",
            paddingBottom: "8px",
            marginBottom: "20px",
            fontWeight: 600
          }}>
            4. SOBRE EL CENTRE
          </h2>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
              Descripció del Centre
            </label>
            <textarea
              value={descripcio}
              onChange={(e) => setDescripcio(e.target.value)}
              placeholder="Explica la filosofia del teu centre, la història o què us fa especials..."
              rows={6}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid var(--crema-fosca, #eae2d1)",
                fontSize: "15px",
                fontFamily: "inherit",
                lineHeight: "1.5",
                boxSizing: "border-box",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* Form Action */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--crema-fosca, #eae2d1)",
          paddingTop: "24px",
          marginTop: "8px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)", maxWidth: "450px" }}>
            <Info size={16} style={{ color: "var(--verd)", flexShrink: 0 }} />
            <span>Els canvis seran publicats immediatament i revalidaran la memòria cau de la teva fitxa de centre pública.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--verd)",
              color: "white",
              padding: "14px 28px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "16px",
              fontFamily: "var(--font-serif, serif)",
              fontStyle: "italic",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(26, 107, 58, 0.15)",
              opacity: (isSubmitting || isUploading) ? 0.7 : 1
            }}
            className="dashboard-primary-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Desant canvis...
              </>
            ) : (
              "Desar Perfil"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
