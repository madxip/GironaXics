"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Upload, Trash2, Image as ImageIcon, Plus } from "lucide-react";
import { Activitat } from "@/lib/types";
import { mapAirtableError } from "@/lib/utils";
import Toast from "@/components/Toast";

interface ActivityFormProps {
  initialData?: Activitat;
  categories: string[];
  barris: string[];
  submitAction: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
}

const PREDEFINED_SUBCATEGORIES: Map<string, string[]> = new Map([
  ["Esports", ["Futbol", "Bàsquet", "Ciclisme", "Natació", "Atletisme", "Patinatge", "Arts marcials", "Gimnàstica", "Tennis / Pàdel"]],
  ["Idiomes", ["Anglès", "Francès", "Alemany"]]
]);

const safeGetSubcategories = (cat: string | undefined): string[] | undefined => {
  if (!cat || typeof cat !== "string") return undefined;
  return PREDEFINED_SUBCATEGORIES.get(cat);
};

const TXT_FORM_DESC = "Omple els detalls de l'activitat extraescolar per publicar-la a la guia.";
const TXT_NOM_ACTIVITAT = "Nom de l'Activitat *";
const TXT_CATEGORIA = "Categoria *";
const TXT_SUBCATEGORIA = "Subcategoria / Subsecció";
const TXT_ALTRA_SUBCATEGORIA = "Altra subcategoria...";
const TXT_BARRI_GIRONA = "Barri de Girona *";
const TXT_DIES = "Dies *";
const TXT_HORARI = "Horari *";
const TXT_EDAT = "Franja d'Edats *";
const TXT_PREU_FACTURACIO = "Preu i Facturació";
const TXT_MENSUAL = "Mensual (€/mes)";
const TXT_TRIMESTRAL = "Trimestral (€/trimestre)";
const TXT_ANUAL = "Anual (€/any)";
const TXT_GRATUIT = "Gratuït";
const TXT_ALTRES_TEXT = "Altres / Text personalitzat";
const TXT_DESCRIPCIO = "Descripció detallada";
const TXT_DURADA = "Durada de la sessió";
const TXT_MATERIAL = "Observacions";
const TXT_DATA_INICI = "Data d'Inici";
const TXT_IDIOMA = "Idioma";
const TXT_QUI_IMPARTEIX = "Qui ho imparteix?";
const TXT_IMATGE_DESTACADA = "Imatge Destacada (Principal)";
const TXT_IMATGE_DESC = "Aquesta imatge es mostrarà com a capçalera principal a la fitxa detallada de l'activitat.";
const TXT_SENSE_IMATGE = "Sense Imatge";
const TXT_FORMAT_RECOMENAT = "Format horitzontal recomanat (recomanat 1200x800). Màxim 4MB.";
const TXT_GALERIA = "Galeria de Fotos";
const TXT_GALERIA_DESC = "Pots afegir diverses imatges per mostrar la vida diària de l'activitat en un carrusel.";
const TXT_CANCELAR = "Cancel·lar";
const TXT_ACTIVITAT_GRATUITA = "L'activitat es publicarà com a gratuïta";

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

  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleFieldChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Subcategories states
  const initialSub = initialData?.subcategoria || "";
  const hasPredefined = safeGetSubcategories(initialData?.categoria);
  const isPredefined = !!(hasPredefined && hasPredefined.includes(initialSub));

  const [subSelectValue, setSubSelectValue] = useState(
    !initialSub ? "" : (isPredefined ? initialSub : "Altres")
  );
  const [customSubValue, setCustomSubValue] = useState(
    isPredefined ? "" : initialSub
  );

  const handleCategoriaChange = (newCat: string) => {
    setCategoria(newCat);
    setSubSelectValue("");
    setCustomSubValue("");
    if (newCat.trim()) {
      setValidationErrors(prev => ({ ...prev, categoria: false }));
    }
  };
  const predefinedSubs = safeGetSubcategories(categoria);
  const [edat, setEdat] = useState(initialData?.edat || "");
  // Parse the initial price for unit dropdown and inputs
  const getInitialPriceState = () => {
    const rawPreu = initialData?.preu !== undefined ? String(initialData.preu).trim() : "";
    if (!rawPreu) return { val: "", unit: "/mes", custom: "" };

    const lower = rawPreu.toLowerCase();
    if (lower === "gratuït" || lower === "gratuit") {
      return { val: "", unit: "gratuit", custom: "" };
    }

    // Check if it's purely numeric
    if (/^[0-9\s.,]+$/.test(rawPreu)) {
      return { val: rawPreu, unit: "/mes", custom: "" };
    }

    // Check if it matches "X/unit" (e.g. "120/trimestre" or "120/any")
    const clean = rawPreu.replace(/€/g, '').trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      const cleanVal = parts[0].trim();
      const cleanUnit = parts.slice(1).join('/').trim().toLowerCase();
      
      if (cleanUnit === 'mes' || cleanUnit === 'mensual') {
        return { val: cleanVal, unit: "/mes", custom: "" };
      }
      if (cleanUnit === 'trimestre' || cleanUnit === 'trimestral') {
        return { val: cleanVal, unit: "/trimestre", custom: "" };
      }
      if (cleanUnit === 'any' || cleanUnit === 'anual') {
        return { val: cleanVal, unit: "/any", custom: "" };
      }
    }

    // Fallback: it's a custom text
    return { val: "", unit: "personalitzat", custom: rawPreu };
  };

  const initialPriceState = getInitialPriceState();
  const [priceVal, setPriceVal] = useState(initialPriceState.val);
  const [priceUnit, setPriceUnit] = useState(initialPriceState.unit);
  const [customPrice, setCustomPrice] = useState(initialPriceState.custom);
  const [horari, setHorari] = useState(initialData?.horari || "");
  const [dies, setDies] = useState(initialData?.dies || "");
  const [descripcio, setDescripcio] = useState(initialData?.descripcio || "");
  const [durada, setDurada] = useState(initialData?.durada || "");
  const [alumnes, setAlumnes] = useState(initialData?.alumnes || "");
  const [material, setMaterial] = useState(initialData?.material || "");
  const [inici, setInici] = useState(initialData?.inici || "");
  const [idioma, setIdioma] = useState(initialData?.idioma || "");
  const [qui_imparteix, setQuiImparteix] = useState(initialData?.qui_imparteix || "");
  
  // Imatges states i refs
  const [imatgeUrl, setImatgeUrl] = useState(initialData?.imatgeUrl || "");
  const [galeria, setGaleria] = useState<string[]>(initialData?.galeria || []);
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFeatured(true);
    setToast(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error en pujar la imatge.");
      }

      const data = await res.json();
      if (data.url) {
        setImatgeUrl(data.url);
      } else {
        throw new Error(data.error || "No s'ha obtingut cap URL.");
      }
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "No s'ha pogut pujar la imatge destacada. Intenta-ho de nou."
      });
    } finally {
      setIsUploadingFeatured(false);
      if (featuredInputRef.current) featuredInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    setToast(null);

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Error en pujar ${file.name}`);
      }
      const data = await res.json();
      if (!data.url) {
        throw new Error(data.error || "No s'ha obtingut cap URL.");
      }
      return data.url as string;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setGaleria((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "No s'han pogut pujar algunes imatges de la galeria. Intenta-ho de nou."
      });
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleRemoveFeatured = () => {
    setImatgeUrl("");
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setGaleria((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    const errors: Record<string, boolean> = {};
    if (!nom.trim()) errors.nom = true;
    if (!barri.trim()) errors.barri = true;
    if (!categoria.trim()) errors.categoria = true;
    if (!edat.trim()) errors.edat = true;
    if (!horari.trim()) errors.horari = true;
    if (!dies.trim()) errors.dies = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setToast({
        type: "error",
        message: "Si us plau, omple tots els camps obligatoris marcats amb asterisc (*)."
      });
      setLoading(false);
      
      // Scroll to the first error smoothly
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => element.focus(), 100);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("barri", barri);
      formData.append("categoria", categoria);
      
      const subcategoria = predefinedSubs 
        ? (subSelectValue === "Altres" ? customSubValue : subSelectValue)
        : customSubValue;
      formData.append("subcategoria", subcategoria);
      formData.append("edat", edat);
      let finalPreu = "";
      if (priceUnit === "/mes") {
        finalPreu = priceVal;
      } else if (priceUnit === "/trimestre") {
        finalPreu = priceVal ? `${priceVal}/trimestre` : "";
      } else if (priceUnit === "/any") {
        finalPreu = priceVal ? `${priceVal}/any` : "";
      } else if (priceUnit === "gratuit") {
        finalPreu = "Gratuït";
      } else if (priceUnit === "personalitzat") {
        finalPreu = customPrice;
      }
      formData.append("preu", finalPreu);
      formData.append("horari", horari);
      formData.append("dies", dies);
      formData.append("descripcio", descripcio);
      formData.append("durada", durada);
      formData.append("alumnes", alumnes);
      formData.append("material", material);
      formData.append("inici", inici);
      formData.append("idioma", idioma);
      formData.append("qui_imparteix", qui_imparteix);
      formData.append("imatgeUrl", imatgeUrl);
      formData.append("galeria", JSON.stringify(galeria));

      const res = await submitAction(null, formData);

      if (res && !res.success) {
        const parsed = mapAirtableError(res.error);
        setToast({ type: "error", message: parsed });
        setLoading(false);
      } else {
        const query = initialData?.id ? "success=updated" : "success=created";
        router.push(`/dashboard?${query}`);
        router.refresh();
      }
    } catch (err) {
      console.error("[Form Submit Error]", err);
      const parsed = mapAirtableError(err);
      setToast({ type: "error", message: parsed });
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
      <div className="dashboard-card-form">
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
          {TXT_FORM_DESC}
        </p>
        {toast && (
          <div className="activity-toast-container">
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
            />
            <style dangerouslySetInnerHTML={{ __html: `
              .activity-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 99999;
                width: calc(100% - 48px);
                max-width: 420px;
                pointer-events: none;
              }
              @media (max-width: 768px) {
                .activity-toast-container {
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
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_NOM_ACTIVITAT}
                </label>
                <input
                  type="text"
                  id="nom"
                  value={nom}
                  onChange={(e) => handleFieldChange("nom", e.target.value, setNom)}
                  placeholder="Ex: Taller de Robòtica Educativa, Anglès extraescolar..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.nom 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    width: "100%",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.nom ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                />
                {validationErrors.nom && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * El nom de l'activitat és obligatori
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_CATEGORIA}
                </label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.categoria 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.categoria ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                >
                  <option value="">-- Tria una categoria --</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {validationErrors.categoria && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * Selecciona una categoria obligatòria
                  </span>
                )}
              </div>

              {categoria && (categoria === "Esports" || categoria === "Idiomes") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    {TXT_SUBCATEGORIA}
                  </label>
                  
                  {predefinedSubs ? (
                    <>
                      <select
                        value={subSelectValue}
                        onChange={(e) => {
                          setSubSelectValue(e.target.value);
                          if (e.target.value !== "Altres") {
                            setCustomSubValue("");
                          }
                        }}
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
                        <option value="">-- Tria una subcategoria --</option>
                        {predefinedSubs.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="Altres">{TXT_ALTRA_SUBCATEGORIA}</option>
                      </select>

                      {subSelectValue === "Altres" && (
                        <input
                          type="text"
                          placeholder="Introdueix la subcategoria personalitzada..."
                          value={customSubValue}
                          onChange={(e) => setCustomSubValue(e.target.value)}
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
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      placeholder="Introdueix una subcategoria (opcional)..."
                      value={customSubValue}
                      onChange={(e) => setCustomSubValue(e.target.value)}
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
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_BARRI_GIRONA}
                </label>
                <select
                  id="barri"
                  value={barri}
                  onChange={(e) => handleFieldChange("barri", e.target.value, setBarri)}
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.barri 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    cursor: "pointer",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.barri ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                >
                  <option value="">-- Tria un barri --</option>
                  {barris.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {validationErrors.barri && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * Selecciona un barri obligatori
                  </span>
                )}
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
                  {TXT_DIES}
                </label>
                <input
                  type="text"
                  id="dies"
                  value={dies}
                  onChange={(e) => handleFieldChange("dies", e.target.value, setDies)}
                  placeholder="Ex: Dilluns i Dimecres, Dissabtes matí..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.dies 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.dies ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                />
                {validationErrors.dies && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * Especificar els dies és obligatori
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_HORARI}
                </label>
                <input
                  type="text"
                  id="horari"
                  value={horari}
                  onChange={(e) => handleFieldChange("horari", e.target.value, setHorari)}
                  placeholder="Ex: 17:00 a 18:30"
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.horari 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.horari ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                />
                {validationErrors.horari && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * L'horari és obligatori
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_EDAT}
                </label>
                <input
                  type="text"
                  id="edat"
                  value={edat}
                  onChange={(e) => handleFieldChange("edat", e.target.value, setEdat)}
                  placeholder="Ex: 6 a 12 anys, P3 a P5..."
                  disabled={loading}
                  style={{
                    padding: "12px 14px",
                    border: validationErrors.edat 
                      ? "2.5px solid #b91c1c" 
                      : "1px solid rgba(26, 107, 58, 0.2)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    outline: "none",
                    color: "var(--fosc)",
                    backgroundColor: validationErrors.edat ? "#fef2f2" : "white",
                    transition: "all 0.2s"
                  }}
                />
                {validationErrors.edat && (
                  <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "600", marginTop: "-2px" }}>
                    * La franja d'edats és obligatòria
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_PREU_FACTURACIO}
                </label>
                
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Select unitat */}
                  <div style={{ flex: "1 1 200px" }}>
                    <select
                      value={priceUnit}
                      onChange={(e) => {
                        setPriceUnit(e.target.value);
                        if (e.target.value === "gratuit") {
                          setPriceVal("");
                          setCustomPrice("");
                        }
                      }}
                      disabled={loading}
                      style={{
                        padding: "12px 14px",
                        border: "1px solid rgba(26, 107, 58, 0.2)",
                        borderRadius: "8px",
                        fontSize: "15px",
                        outline: "none",
                        cursor: "pointer",
                        color: "var(--fosc)",
                        backgroundColor: "white",
                        width: "100%"
                      }}
                    >
                      <option value="/mes">{TXT_MENSUAL}</option>
                      <option value="/trimestre">{TXT_TRIMESTRAL}</option>
                      <option value="/any">{TXT_ANUAL}</option>
                      <option value="gratuit">{TXT_GRATUIT}</option>
                      <option value="personalitzat">{TXT_ALTRES_TEXT}</option>
                    </select>
                  </div>

                  {/* Input de preu segons la unitat triada */}
                  {priceUnit !== "gratuit" && priceUnit !== "personalitzat" && (
                    <div style={{ flex: "2 1 200px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="number"
                        value={priceVal}
                        onChange={(e) => setPriceVal(e.target.value)}
                        placeholder="Ex: 45 (deixar buit si no aplica)"
                        disabled={loading}
                        style={{
                          padding: "12px 14px",
                          border: "1px solid rgba(26, 107, 58, 0.2)",
                          borderRadius: "8px",
                          fontSize: "15px",
                          outline: "none",
                          color: "var(--fosc)",
                          flexGrow: 1
                        }}
                      />
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "var(--muted)" }}>
                        € {priceUnit}
                      </span>
                    </div>
                  )}

                  {priceUnit === "personalitzat" && (
                    <div style={{ flex: "2 1 200px" }}>
                      <input
                        type="text"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="Ex: 15 €/sessió, 150 € per curs"
                        disabled={loading}
                        style={{
                          padding: "12px 14px",
                          border: "1px solid rgba(26, 107, 58, 0.2)",
                          borderRadius: "8px",
                          fontSize: "15px",
                          outline: "none",
                          color: "var(--fosc)",
                          width: "100%"
                        }}
                      />
                    </div>
                  )}

                  {priceUnit === "gratuit" && (
                    <div style={{ flex: "2 1 200px", alignSelf: "center" }}>
                      <span style={{ fontSize: "14px", color: "var(--verd)", fontWeight: "600", fontStyle: "italic" }}>
                        {TXT_ACTIVITAT_GRATUITA}
                      </span>
                    </div>
                  )}
                </div>
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
                  {TXT_DESCRIPCIO}
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
                    {TXT_DURADA}
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
                    {TXT_MATERIAL}
                  </label>
                  <textarea
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder={"Ex: Opció de fer setmanes.\n1 setmana: 100 €\n2 setmanes: 190 €\n..."}
                    disabled={loading}
                    rows={3}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                    {TXT_DATA_INICI}
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
                    {TXT_IDIOMA}
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
                    {TXT_QUI_IMPARTEIX}
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

          {/* Section 4: Imatges de l'Activitat */}
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
              4. Imatges de l'Activitat
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* Part A: Imatge Destacada */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                  {TXT_IMATGE_DESTACADA}
                </label>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "-4px", marginBottom: "12px" }}>
                  {TXT_IMATGE_DESC}
                </p>

                <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{
                    width: "240px",
                    height: "150px",
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
                        alt="Imatge destacada previsualització"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => setImatgeUrl("")}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--muted)", padding: "12px" }}>
                        <ImageIcon size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                        <span style={{ fontSize: "12px", display: "block" }}>{TXT_SENSE_IMATGE}</span>
                      </div>
                    )}
                    {isUploadingFeatured && (
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

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="file"
                        ref={featuredInputRef}
                        onChange={handleFeaturedUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => featuredInputRef.current?.click()}
                        disabled={isUploadingFeatured || loading}
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
                      >
                        <Upload size={16} />
                        Puja Imatge
                      </button>

                      {imatgeUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveFeatured}
                          disabled={isUploadingFeatured || loading}
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
                      {TXT_FORMAT_RECOMENAT}
                    </p>
                  </div>
                </div>
              </div>

              {/* Part B: Galeria d'Imatges */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase", marginBottom: "8px" }}>
                  {TXT_GALERIA}
                </label>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "-4px", marginBottom: "12px" }}>
                  {TXT_GALERIA_DESC}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Grid of gallery items */}
                  {galeria.length > 0 && (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "12px"
                    }}>
                      {galeria.map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            aspectRatio: "1",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid var(--crema-fosca, #eae2d1)",
                            position: "relative",
                            backgroundColor: "#fbfcfb"
                          }}
                        >
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img
                            src={url}
                            alt={`Galeria ${idx + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={() => handleRemoveGalleryImage(idx)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              backgroundColor: "rgba(220, 38, 38, 0.9)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                            title="Eliminar imatge"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add button */}
                  <div>
                    <input
                      type="file"
                      ref={galleryInputRef}
                      onChange={handleGalleryUpload}
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingGallery || loading}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: "1px dashed var(--verd)",
                        backgroundColor: "#fbfcfb",
                        color: "var(--verd)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {isUploadingGallery ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Pujant imatges...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Afegir fotos a la galeria
                        </>
                      )}
                    </button>
                  </div>
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
              {TXT_CANCELAR}
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
