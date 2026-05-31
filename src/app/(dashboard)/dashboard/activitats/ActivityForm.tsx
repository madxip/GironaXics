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

// --- HELPERS DE PARSEIG I FORMAT PER A LA FASE 2 ---
const parseDateRange = (text: string): { start: string; end: string } => {
  if (!text) return { start: "", end: "" };
  const regex = /(\d{2})\/(\d{2})\/(\d{4})/g;
  const match1 = regex.exec(text);
  const match2 = regex.exec(text);
  if (match1) {
    const startStr = `${match1[3]}-${match1[2]}-${match1[1]}`;
    const endStr = match2 ? `${match2[3]}-${match2[2]}-${match2[1]}` : "";
    return { start: startStr, end: endStr };
  }
  const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
  const lower = text.toLowerCase();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');
  const parts = lower.split(/\bal\b/);
  if (parts.length > 1) {
    const firstPart = parts[0];
    const secondPart = parts[1];
    let endMonthIdx = -1;
    for (let i = 0; i < months.length; i++) {
      if (secondPart.includes(months[i])) { endMonthIdx = i; break; }
    }
    const endDayMatch = secondPart.match(/\b\d{1,2}\b/);
    const endDay = endDayMatch ? parseInt(endDayMatch[0]) : 1;
    let startMonthIdx = endMonthIdx;
    for (let i = 0; i < months.length; i++) {
      if (firstPart.includes(months[i])) { startMonthIdx = i; break; }
    }
    const startDayMatch = firstPart.match(/\b\d{1,2}\b/);
    const startDay = startDayMatch ? parseInt(startDayMatch[0]) : 1;
    if (startMonthIdx !== -1 && endMonthIdx !== -1) {
      return {
        start: `${year}-${pad(startMonthIdx + 1)}-${pad(startDay)}`,
        end: `${year}-${pad(endMonthIdx + 1)}-${pad(endDay)}`
      };
    }
  }
  const singleMatch = text.match(/\b\d{1,2}\b/);
  let mIdx = -1;
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) { mIdx = i; break; }
  }
  if (singleMatch && mIdx !== -1) {
    return {
      start: `${year}-${pad(mIdx + 1)}-${pad(parseInt(singleMatch[0]))}`,
      end: ""
    };
  }
  return { start: "", end: "" };
};

const parseSingleDate = (text: string): string => {
  if (!text) return "";
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
  const lower = text.toLowerCase();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  let mIdx = -1;
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) { mIdx = i; break; }
  }
  const dayMatch = text.match(/\b\d{1,2}\b/);
  if (dayMatch && mIdx !== -1) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(mIdx + 1)}-${pad(parseInt(dayMatch[0]))}`;
  }
  return "";
};

const parseMultipleDates = (text: string): string[] => {
  if (!text) return [""];
  const regex = /(\d{2})\/(\d{2})\/(\d{4})/g;
  let match;
  const matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
  }
  if (matches.length > 0) {
    return matches.map(m => `${m[3]}-${m[2]}-${m[1]}`);
  }
  const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
  const lower = text.toLowerCase();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  let monthIdx = -1;
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i])) { monthIdx = i; break; }
  }
  if (monthIdx === -1) return [""];
  const monthWord = months[monthIdx];
  const beforeMonth = lower.split(monthWord)[0];
  const dayMatches = beforeMonth.match(/\b\d{1,2}\b/g);
  if (!dayMatches) return [""];
  const pad = (n: number) => String(n).padStart(2, '0');
  return dayMatches.map(d => `${year}-${pad(monthIdx + 1)}-${pad(parseInt(d))}`);
};

const formatMultipleDates = (dates: string[]) => {
  const cleanDates = dates
    .filter(Boolean)
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());
  if (cleanDates.length === 0) return "";
  const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
  const firstDate = cleanDates[0];
  const sameMonthAndYear = cleanDates.every(
    d => d.getMonth() === firstDate.getMonth() && d.getFullYear() === firstDate.getFullYear()
  );
  if (sameMonthAndYear) {
    const days = cleanDates.map(d => d.getDate());
    let daysStr = "";
    if (days.length === 1) daysStr = String(days[0]);
    else if (days.length === 2) daysStr = `${days[0]} i ${days[1]}`;
    else daysStr = `${days.slice(0, -1).join(", ")} i ${days[days.length - 1]}`;
    return `${daysStr} de ${months[firstDate.getMonth()]} de ${firstDate.getFullYear()}`;
  }
  const strings = cleanDates.map(d => `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`);
  let finalStr = "";
  if (strings.length === 1) finalStr = strings[0];
  else if (strings.length === 2) finalStr = `${strings[0]} i ${strings[1]}`;
  else finalStr = `${strings.slice(0, -1).join(", ")} i ${strings[strings.length - 1]}`;
  return finalStr;
};

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
  const [tipus, setTipus] = useState(initialData?.tipus || "Extraescolar");
  const [horari, setHorari] = useState(initialData?.horari || "");
  const [dies, setDies] = useState(initialData?.dies || "");

  // --- EXTRAESCOLARS WEEKDAYS STATE ---
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(() => {
    if (initialData?.tipus === "Extraescolar") {
      const val = initialData?.dies || "";
      const lower = val.toLowerCase();
      const weekdays = [];
      if (lower.includes("dilluns")) weekdays.push("Dilluns");
      if (lower.includes("dimarts")) weekdays.push("Dimarts");
      if (lower.includes("dimecres")) weekdays.push("Dimecres");
      if (lower.includes("dijous")) weekdays.push("Dijous");
      if (lower.includes("divendres")) weekdays.push("Divendres");
      if (lower.includes("dissabte")) weekdays.push("Dissabte");
      if (lower.includes("diumenge")) weekdays.push("Diumenge");
      return weekdays;
    }
    return [];
  });

  // --- CASALS STATES (RANGE OR INDIVIDUAL) ---
  const isCasalIndividual = (() => {
    if (initialData?.tipus !== "Casal") return false;
    const text = (initialData.dies || "").toLowerCase();
    return (text.includes(",") || text.includes(" i ")) && !text.includes("del ") && !text.includes(" al ");
  })();
  
  const [casalDateMode, setCasalDateMode] = useState<"range" | "individual">(isCasalIndividual ? "individual" : "range");

  const [startDate, setStartDate] = useState(() => {
    if (initialData?.tipus === "Casal" && !isCasalIndividual) {
      const parsed = parseDateRange(initialData.dies || "");
      return parsed.start;
    }
    return "";
  });
  const [endDate, setEndDate] = useState(() => {
    if (initialData?.tipus === "Casal" && !isCasalIndividual) {
      const parsed = parseDateRange(initialData.dies || "");
      return parsed.end;
    }
    return "";
  });

  const [multipleDates, setMultipleDates] = useState<string[]>(() => {
    if (initialData?.tipus === "Casal" && isCasalIndividual) {
      const parsed = parseMultipleDates(initialData.dies || "");
      return parsed.length > 0 ? parsed : [""];
    }
    return [""];
  });

  // --- TALLERS STATES (PUNTUAL OR RECURRENT) ---
  const isRecurringTaller = !!(
    initialData?.tipus?.toLowerCase().includes("taller") && 
    (initialData.dies || "").toLowerCase().startsWith("cada")
  );

  const [tallerMode, setTallerMode] = useState<"puntual" | "recurrent">(isRecurringTaller ? "recurrent" : "puntual");
  
  const [singleDate, setSingleDate] = useState(() => {
    if (initialData?.tipus?.toLowerCase().includes("taller") && !isRecurringTaller) {
      return parseSingleDate(initialData.dies || "");
    }
    return "";
  });

  const [selectedTallerWeekdays, setSelectedTallerWeekdays] = useState<string[]>(() => {
    if (initialData?.tipus?.toLowerCase().includes("taller") && isRecurringTaller) {
      const val = initialData.dies || "";
      const lower = val.toLowerCase();
      const weekdays = [];
      if (lower.includes("dilluns")) weekdays.push("Dilluns");
      if (lower.includes("dimarts")) weekdays.push("Dimarts");
      if (lower.includes("dimecres")) weekdays.push("Dimecres");
      if (lower.includes("dijous")) weekdays.push("Dijous");
      if (lower.includes("divendres")) weekdays.push("Divendres");
      if (lower.includes("dissabte")) weekdays.push("Dissabte");
      if (lower.includes("diumenge")) weekdays.push("Diumenge");
      return weekdays;
    }
    return [];
  });

  // --- FORMATTERS ---
  const joinWeekdays = (days: string[]) => {
    const order = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];
    const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (sorted.length === 0) return "";
    if (sorted.length === 1) return sorted[0];
    if (sorted.length === 2) return `${sorted[0]} i ${sorted[1]}`;
    return `${sorted.slice(0, -1).join(", ")} i ${sorted[sorted.length - 1]}`;
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return "";
    const start = new Date(startStr);
    const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
    
    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const startYear = start.getFullYear();

    if (!endStr) {
      return `A partir del ${startDay} de ${startMonth} de ${startYear}`;
    }
    
    const end = new Date(endStr);
    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const endYear = end.getFullYear();
    
    if (startMonth === endMonth) {
      return `Del ${startDay} al ${endDay} de ${startMonth} de ${endYear}`;
    }
    return `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
  };

  const formatSingleDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"];
    const months = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const formatRecurringTaller = (days: string[]) => {
    const joined = joinWeekdays(days);
    if (!joined) return "";
    return `Cada ${joined.toLowerCase()}`;
  };
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
      formData.append("tipus", tipus);

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

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  Tipus d&apos;Activitat *
                </label>
                <select
                  id="tipus"
                  value={tipus}
                  onChange={(e) => setTipus(e.target.value)}
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
                    transition: "all 0.2s"
                  }}
                >
                  <option value="Extraescolar">Extraescolar (Setmanal / Curs anual)</option>
                  <option value="Casal">Casal (Estiu, Nadal, Setmana Santa)</option>
                  <option value="Taller / Oci">Taller o Oci (Monogràfic, escape room, aniversari, puntual)</option>
                </select>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--verd-fosc)", textTransform: "uppercase" }}>
                  {TXT_DIES}
                </label>
                
                {/* 1. Selector per a Extraescolars (Setmana DL-DG) */}
                {tipus === "Extraescolar" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                      Tria els dies de la setmana en què es fa l'activitat:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"].map((day) => {
                        const isSelected = selectedWeekdays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              let newDays = [];
                              if (isSelected) {
                                newDays = selectedWeekdays.filter(d => d !== day);
                              } else {
                                newDays = [...selectedWeekdays, day];
                              }
                              setSelectedWeekdays(newDays);
                              const joined = joinWeekdays(newDays);
                              setDies(joined);
                              if (joined.trim()) {
                                setValidationErrors(prev => ({ ...prev, dies: false }));
                              }
                            }}
                            style={{
                              padding: "10px 18px",
                              borderRadius: "30px",
                              border: isSelected ? "1px solid var(--verd)" : "1px solid var(--crema-fosca)",
                              backgroundColor: isSelected ? "var(--verd)" : "white",
                              color: isSelected ? "white" : "var(--fosc)",
                              fontFamily: "var(--font-sans)",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Selector per a Casals (Rang o Dies concrets) */}
                {tipus === "Casal" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Sub-selector tipus de Casal */}
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCasalDateMode("range");
                          const formatted = formatDateRange(startDate, endDate);
                          setDies(formatted);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: casalDateMode === "range" ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)",
                          backgroundColor: casalDateMode === "range" ? "rgba(26, 107, 58, 0.05)" : "white",
                          color: "var(--verd-fosc)",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        📅 Dates seguides (Interval de dates)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCasalDateMode("individual");
                          const formatted = formatMultipleDates(multipleDates);
                          setDies(formatted);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: casalDateMode === "individual" ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)",
                          backgroundColor: casalDateMode === "individual" ? "rgba(26, 107, 58, 0.05)" : "white",
                          color: "var(--verd-fosc)",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        📌 Dies concrets (Llistat de dies solts)
                      </button>
                    </div>

                    {casalDateMode === "range" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                          Especifica les dates de funcionament del Casal (inici i final):
                        </p>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)" }}>DATA D'INICI</span>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => {
                                setStartDate(e.target.value);
                                const formatted = formatDateRange(e.target.value, endDate);
                                setDies(formatted);
                                if (formatted.trim()) {
                                  setValidationErrors(prev => ({ ...prev, dies: false }));
                                }
                              }}
                              style={{
                                padding: "10px 12px",
                                border: "1px solid rgba(26, 107, 58, 0.2)",
                                borderRadius: "8px",
                                fontSize: "14px",
                                color: "var(--fosc)",
                                outline: "none"
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)" }}>DATA DE FI (OPCIONAL)</span>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => {
                                setEndDate(e.target.value);
                                const formatted = formatDateRange(startDate, e.target.value);
                                setDies(formatted);
                                if (formatted.trim()) {
                                  setValidationErrors(prev => ({ ...prev, dies: false }));
                                }
                              }}
                              style={{
                                padding: "10px 12px",
                                border: "1px solid rgba(26, 107, 58, 0.2)",
                                borderRadius: "8px",
                                fontSize: "14px",
                                color: "var(--fosc)",
                                outline: "none"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                          Afegeix els dies concrets en què tindrà lloc el Casal:
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {multipleDates.map((dateVal, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <input
                                type="date"
                                value={dateVal}
                                onChange={(e) => {
                                  const newDates = [...multipleDates];
                                  newDates[idx] = e.target.value;
                                  setMultipleDates(newDates);
                                  const formatted = formatMultipleDates(newDates);
                                  setDies(formatted);
                                  if (formatted.trim()) {
                                    setValidationErrors(prev => ({ ...prev, dies: false }));
                                  }
                                }}
                                style={{
                                  padding: "10px 12px",
                                  border: "1px solid rgba(26, 107, 58, 0.2)",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  color: "var(--fosc)",
                                  outline: "none",
                                  flexGrow: 1,
                                  maxWidth: "240px"
                                }}
                              />
                              {multipleDates.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDates = multipleDates.filter((_, i) => i !== idx);
                                    setMultipleDates(newDates);
                                    const formatted = formatMultipleDates(newDates);
                                    setDies(formatted);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #dc2626",
                                    backgroundColor: "transparent",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setMultipleDates([...multipleDates, ""]);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              border: "1px dashed var(--verd)",
                              backgroundColor: "#fbfcfb",
                              color: "var(--verd)",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              marginTop: "4px"
                            }}
                          >
                            <Plus size={14} />
                            Afegir dia concret
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Selector per a Tallers (Puntual o Recurrent) */}
                {tipus === "Taller / Oci" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Sub-selector tipus de Taller */}
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTallerMode("puntual");
                          const formatted = formatSingleDate(singleDate);
                          setDies(formatted);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: tallerMode === "puntual" ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)",
                          backgroundColor: tallerMode === "puntual" ? "rgba(26, 107, 58, 0.05)" : "white",
                          color: "var(--verd-fosc)",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        ⚡ Taller puntual (Dia únic)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTallerMode("recurrent");
                          const formatted = formatRecurringTaller(selectedTallerWeekdays);
                          setDies(formatted);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: tallerMode === "recurrent" ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)",
                          backgroundColor: tallerMode === "recurrent" ? "rgba(26, 107, 58, 0.05)" : "white",
                          color: "var(--verd-fosc)",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        🔄 Taller recurrent (Periòdic)
                      </button>
                    </div>

                    {tallerMode === "puntual" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                          Tria la data de celebració del taller o activitat puntual:
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "300px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)" }}>DATA DEL TALLER</span>
                          <input
                            type="date"
                            value={singleDate}
                            onChange={(e) => {
                              setSingleDate(e.target.value);
                              const formatted = formatSingleDate(e.target.value);
                              setDies(formatted);
                              if (formatted.trim()) {
                                setValidationErrors(prev => ({ ...prev, dies: false }));
                              }
                            }}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid rgba(26, 107, 58, 0.2)",
                              borderRadius: "8px",
                              fontSize: "14px",
                              color: "var(--fosc)",
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                          Tria els dies de la setmana en què es fa el taller de manera recurrent:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"].map((day) => {
                            const isSelected = selectedTallerWeekdays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  let newDays = [];
                                  if (isSelected) {
                                    newDays = selectedTallerWeekdays.filter(d => d !== day);
                                  } else {
                                    newDays = [...selectedTallerWeekdays, day];
                                  }
                                  setSelectedTallerWeekdays(newDays);
                                  const formatted = formatRecurringTaller(newDays);
                                  setDies(formatted);
                                  if (formatted.trim()) {
                                    setValidationErrors(prev => ({ ...prev, dies: false }));
                                  }
                                }}
                                style={{
                                  padding: "10px 18px",
                                  borderRadius: "30px",
                                  border: isSelected ? "1px solid var(--verd)" : "1px solid var(--crema-fosca)",
                                  backgroundColor: isSelected ? "var(--verd)" : "white",
                                  color: isSelected ? "white" : "var(--fosc)",
                                  fontFamily: "var(--font-sans)",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Input Text de control manual pre-omplert (Visible per defecte o editable per afegir matisos) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)" }}>
                    TEXT DELS DIES GENERAT (POTS EDITAR-LO MANUALMENT) *
                  </span>
                  <input
                    type="text"
                    id="dies"
                    value={dies}
                    onChange={(e) => handleFieldChange("dies", e.target.value, setDies)}
                    placeholder="Ex: Dilluns i Dimecres, Del 1 al 31 de juliol..."
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
                      * El text descriptiu dels dies o dates és obligatori
                    </span>
                  )}
                </div>
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
