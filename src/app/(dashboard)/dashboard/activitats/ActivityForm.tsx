"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Upload, Trash2, Image as ImageIcon, Plus, Eye, X } from "lucide-react";
import { Activitat, Centre } from "@/lib/types";
import { mapAirtableError } from "@/lib/utils";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import MultiDatePicker from "@/components/MultiDatePicker";



interface ActivityFormProps {
  initialData?: Activitat;
  categories: string[];
  barris: { girona: string[]; altres: string[] };
  submitAction: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
  centre?: Centre;
  allCentres?: Centre[];
  isAdmin?: boolean;
}

const PREDEFINED_SUBCATEGORIES: Map<string, string[]> = new Map([
  ["Esports", ["Futbol", "Bàsquet", "Ciclisme", "Natació", "Atletisme", "Patinatge", "Arts marcials", "Gimnàstica", "Tennis / Pàdel"]],
  ["Idiomes", ["Anglès", "Francès", "Alemany"]]
]);

const safeGetSubcategories = (cat: string | undefined): string[] | undefined => {
  if (!cat || typeof cat !== "string") return undefined;
  return PREDEFINED_SUBCATEGORIES.get(cat);
};

const TXT_SUBCATEGORIA = "Subcategoria / Subsecció";
const TXT_ALTRA_SUBCATEGORIA = "Altra subcategoria...";
const TXT_MENSUAL = "Mensual (€/mes)";
const TXT_TRIMESTRAL = "Trimestral (€/trimestre)";
const TXT_ANUAL = "Anual (€/any)";
const TXT_GRATUIT = "Gratuït";
const TXT_ALTRES_TEXT = "Altres / Text personalitzat";
const TXT_SENSE_IMATGE = "Sense Imatge";
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
  const months = ["gener", "febrer", "marÃ§", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
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

/**
 * Parseja les dates d'inici i fi del camp `dies` d'un taller recurrent.
 * Format: "Cada dimarts. Del 3 de setembre de 2025 al 20 de juny de 2026"
 * o: "Cada dimarts. A partir del 3 de setembre de 2026"
 */
const parseRecurrentRange = (dies: string): { start: string; end: string } => {
  if (!dies || !dies.toLowerCase().startsWith('cada')) return { start: '', end: '' };
  const dotIdx = dies.indexOf('. ');
  if (dotIdx === -1) return { start: '', end: '' };
  const rangePart = dies.substring(dotIdx + 2);
  const MONTHS_R = ["gener","febrer","mar\u00e7","abril","maig","juny","juliol","agost","setembre","octubre","novembre","desembre"];
  const lower = rangePart.toLowerCase();
  const pad = (n: number) => String(n).padStart(2, '0');
  const allYears = Array.from(rangePart.matchAll(/\b(20\d{2})\b/g)).map(m => parseInt(m[1]));
  const alIdx = lower.indexOf(' al ');
  if (alIdx === -1) {
    const year = allYears[0] || new Date().getFullYear();
    let mIdx = -1;
    for (let i = 0; i < MONTHS_R.length; i++) { if (lower.includes(MONTHS_R[i])) { mIdx = i; break; } }
    const dayM = lower.match(/\b(\d{1,2})\b/);
    if (mIdx !== -1 && dayM) return { start: `${year}-${pad(mIdx + 1)}-${pad(parseInt(dayM[1]))}`, end: '' };
    return { start: '', end: '' };
  }
  const startPart = lower.substring(0, alIdx);
  const endPart = lower.substring(alIdx + 4);
  let startMIdx = -1; for (let i = 0; i < MONTHS_R.length; i++) { if (startPart.includes(MONTHS_R[i])) { startMIdx = i; break; } }
  let endMIdx = -1;   for (let i = 0; i < MONTHS_R.length; i++) { if (endPart.includes(MONTHS_R[i]))   { endMIdx = i; break; } }
  const startDayM = startPart.match(/\b(\d{1,2})\b/);
  const endDayM   = endPart.match(/\b(\d{1,2})\b/);
  const startYearM = startPart.match(/\b(20\d{2})\b/);
  const endYearM   = endPart.match(/\b(20\d{2})\b/);
  const startYear = startYearM ? parseInt(startYearM[1]) : (allYears[0] || new Date().getFullYear());
  const endYear   = endYearM   ? parseInt(endYearM[1])   : (allYears[allYears.length - 1] || new Date().getFullYear());
  return {
    start: (startMIdx !== -1 && startDayM) ? `${startYear}-${pad(startMIdx + 1)}-${pad(parseInt(startDayM[1]))}` : '',
    end:   (endMIdx !== -1   && endDayM)   ? `${endYear}-${pad(endMIdx + 1)}-${pad(parseInt(endDayM[1]))}` : ''
  };
};

const parseSingleDate = (text: string): string => {
  if (!text) return "";
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const months = ["gener", "febrer", "marÃ§", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
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
  const months = ["gener", "febrer", "marÃ§", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
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
  const months = ["gener", "febrer", "marÃ§", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
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

function parseMarkdownToReact(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    const bulletRegex = /^(\s*[-*â€¢]\s+)(.*)/;
    const matchBullet = line.match(bulletRegex);
    
    const parseInline = (inlineText: string) => {
      const boldParts = inlineText.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        const isBold = bIdx % 2 !== 0;
        const italicParts = bPart.split(/\*([^*_]+)\*/g);
        const renderedItalics = italicParts.map((iPart, iIdx) => {
          const isItalic = iIdx % 2 !== 0;
          if (isItalic) {
            return <em key={iIdx}>{iPart}</em>;
          }
          return iPart;
        });
        
        if (isBold) {
          return <strong key={bIdx}>{renderedItalics}</strong>;
        }
        return <span key={bIdx}>{renderedItalics}</span>;
      });
    };
    
    if (matchBullet) {
      const content = matchBullet[2];
      return (
        <ul key={lineIdx} style={{ margin: '4px 0 4px 24px', padding: 0, listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>
            {parseInline(content)}
          </li>
        </ul>
      );
    }
    
    if (line.trim() === '') {
      return <div key={lineIdx} style={{ height: '0.8em' }} />;
    }
    
    return (
      <p key={lineIdx} style={{ margin: '0 0 10px 0' }}>
        {parseInline(line)}
      </p>
    );
  });
}

export default function ActivityForm({
  initialData,
  categories,
  barris,
  submitAction,
  title,
  centre,
  allCentres,
  isAdmin,
}: ActivityFormProps) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  React.useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPreview]);




  const [nom, setNom] = useState(initialData?.nom || "");
  const NOVA_POBLACIO = "__nova_poblacio__";
  const [barri, setBarri] = useState(
    (initialData?.barri && !barris.girona.includes(initialData.barri) && !barris.altres.includes(initialData.barri))
      ? NOVA_POBLACIO
      : (initialData?.barri || "")
  );
  const [customPoblacio, setCustomPoblacio] = useState(
    (initialData?.barri && !barris.girona.includes(initialData.barri) && !barris.altres.includes(initialData.barri))
      ? initialData.barri
      : ""
  );
  const [categoria, setCategoria] = useState(initialData?.categoria || "");
  // Admin: centre seleccionat quan crea una activitat per a un altre centre
  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    initialData?.centreId || centre?.id || ""
  );
  const [centreSearch, setCentreSearch] = useState("");

  // Per a la previsualitzaciÃ³: si l'admin tÃ© un centre seleccionat, usem aquell; sinÃ³ el centre del prop
  const safeCentres = allCentres ?? [];
  const centrePreview = (isAdmin && safeCentres.length > 0 && selectedCentreId)
    ? safeCentres.find(c => c.id === selectedCentreId) ?? centre
    : centre;

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
    if (lower === "gratuÃ¯t" || lower === "gratuit") {
      return { val: "", unit: "gratuit", custom: "" };
    }

    // Check if it's purely numeric
    if (/^[0-9\s.,]+$/.test(rawPreu)) {
      return { val: rawPreu, unit: "/mes", custom: "" };
    }

    // Check if it matches "X/unit" (e.g. "120/trimestre" or "120/any")
    const clean = rawPreu.replace(/â‚¬/g, '').trim();
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
  const TIPUS_VALIDS = ["Extraescolar", "Casal", "Taller"];
  const [tipus, setTipus] = useState(
    TIPUS_VALIDS.includes(initialData?.tipus || "") ? (initialData?.tipus || "Extraescolar") : "Extraescolar"
  );
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

  // Dates d'inici i fi per al mode recurrent
  const [recurrentStart, setRecurrentStart] = useState(() =>
    isRecurringTaller ? parseRecurrentRange(initialData?.dies || '').start : ''
  );
  const [recurrentEnd, setRecurrentEnd] = useState(() =>
    isRecurringTaller ? parseRecurrentRange(initialData?.dies || '').end : ''
  );

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
    const start = new Date(startStr + 'T00:00:00');
    const months = ["gener", "febrer", "mar\u00e7", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const startYear = start.getFullYear();
    if (!endStr) {
      return `A partir del ${startDay} de ${startMonth} de ${startYear}`;
    }
    const end = new Date(endStr + 'T00:00:00');
    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const endYear = end.getFullYear();
    // Cross-year: show both years explicitly
    if (startYear !== endYear) {
      return `Del ${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
    }
    if (startMonth === endMonth) {
      return `Del ${startDay} al ${endDay} de ${startMonth} de ${endYear}`;
    }
    return `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
  };

  const formatSingleDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"];
    const months = ["gener", "febrer", "marÃ§", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
    
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

  // Construeix el text complet del camp `dies` per a tallers recurrents
  const buildRecurrentDies = (weekdays: string[], start: string, end: string) => {
    const weekdayText = formatRecurringTaller(weekdays);
    if (!weekdayText) return weekdayText;
    const rangeText = formatDateRange(start, end);
    return rangeText ? `${weekdayText}. ${rangeText}` : weekdayText;
  };
  const [descripcio, setDescripcio] = useState(initialData?.descripcio || "");
  const [durada, setDurada] = useState(initialData?.durada || "");
  const [alumnes, setAlumnes] = useState(initialData?.alumnes || "");
  const [material, setMaterial] = useState(initialData?.material || "");
  const [inici, setInici] = useState(initialData?.inici || "");
  const [torns, setTorns] = useState(initialData?.torns || "");
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
    if (!barri.trim() || (barri === NOVA_POBLACIO && !customPoblacio.trim())) errors.barri = true;
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
      formData.append("barri", barri === NOVA_POBLACIO ? customPoblacio.trim() : barri);
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
        finalPreu = "GratuÃ¯t";
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
      formData.append("torns", torns);
      // Admin: afegir el centre seleccionat al FormData (no llegit del hidden input perquÃ¨ construÃ¯m FormData manualment)
      if (isAdmin && selectedCentreId) {
        formData.append("centreId", selectedCentreId);
      }

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

  /* ── Tab labels ──────────────────────────────────────────── */
  const TABS = [
    { long: "Informaci\u00f3 b\u00e0sica", short: "Info" },
    { long: "Horari i preu",              short: "Horari" },
    { long: "Detalls",                    short: "Detalls" },
    { long: "Imatges",                    short: "Imatges" },
  ];

  /* ── Field style helpers ─────────────────────────────────── */
  const fieldStyle = (err?: boolean): React.CSSProperties => ({
    padding: "12px 14px",
    border: err ? "2.5px solid #b91c1c" : "1px solid rgba(26,107,58,0.2)",
    borderRadius: "8px",
    fontSize: "15px",
    outline: "none",
    color: "var(--fosc)",
    backgroundColor: err ? "#fef2f2" : "white",
    transition: "all 0.2s",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--verd-fosc)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const fieldGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const errMsg = (msg: string) => (
    <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: 600 }}>{msg}</span>
  );

  return (
    <>
      {/* â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <style dangerouslySetInnerHTML={{ __html: `
        .af-outer { max-width: 900px; margin: 0 auto; padding-bottom: 96px; }
        .af-back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--muted); text-decoration: none; font-size: 14px;
          font-weight: 500; transition: color 0.2s; margin-bottom: 20px;
        }
        .af-back-link:hover { color: var(--verd); }
        .af-header {
          background: white; border-radius: 12px 12px 0 0;
          border: 1px solid var(--crema-fosca, #eae2d1);
          border-bottom: none;
          padding: 28px 32px 0;
        }
        .af-kicker {
          font-size: 11px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--verd); margin: 0 0 4px;
        }
        .af-page-title {
          font-family: var(--font-serif, serif); font-style: italic;
          font-size: 32px; color: var(--verd-fosc); margin: 0;
          font-weight: 600; line-height: 1.1;
        }
        .af-title-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; margin-bottom: 24px;
        }
        .af-status {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 100px; font-size: 13px;
          font-weight: 700; white-space: nowrap; flex-shrink: 0; margin-top: 8px;
        }
        .af-status--pub { background: #e6f4ec; color: #1a6b3a; }
        .af-status--nopub { background: #f3f4f6; color: #6b7280; }
        .af-tabs {
          display: flex; gap: 0; border-bottom: 1px solid var(--crema-fosca, #eae2d1);
          overflow-x: auto; scrollbar-width: none;
        }
        .af-tabs::-webkit-scrollbar { display: none; }
        .af-tab {
          padding: 14px 20px; font-size: 14px; font-weight: 600;
          color: var(--muted); border: none; background: none; cursor: pointer;
          border-bottom: 2.5px solid transparent; transition: all 0.2s;
          white-space: nowrap; margin-bottom: -1px; font-family: inherit;
        }
        .af-tab:hover { color: var(--verd-fosc); }
        .af-tab--active { color: var(--verd-fosc); border-bottom-color: var(--verd); }
        .af-tab-short { display: none; }
        .af-form {
          background: white; border-radius: 0 0 12px 12px;
          border: 1px solid var(--crema-fosca, #eae2d1); border-top: none;
        }
        .af-panel { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
        .af-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .af-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .af-day-btn {
          padding: 9px 18px; border-radius: 30px; border: 1px solid var(--crema-fosca);
          background: white; color: var(--fosc); font-family: var(--font-sans);
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .af-day-btn.active {
          border-color: var(--verd); background: var(--verd); color: white;
        }
        .af-bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: white; border-top: 1px solid var(--crema-fosca, #eae2d1);
          display: flex; align-items: center; justify-content: flex-end;
          gap: 12px; padding: 14px 24px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }
        .af-btn-cancel {
          padding: 10px 20px; border-radius: 8px; border: 1px solid var(--crema-fosca);
          background: transparent; color: var(--muted); font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .af-btn-cancel:hover { border-color: var(--muted); color: var(--fosc); }
        .af-btn-preview {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 8px;
          border: 1.5px solid var(--verd); background: transparent; color: var(--verd);
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: all 0.2s;
        }
        .af-btn-preview:hover { background: rgba(26,107,58,0.05); }
        .af-btn-save {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 8px; border: none;
          background: var(--verd-fosc, #1a4731); color: white;
          font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--font-serif, serif);
          font-style: italic; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(26,107,58,0.2);
        }
        .af-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .af-btn-save:hover:not(:disabled) { background: var(--verd, #1a6b3a); }
        .af-preu-row {
          display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
        }
        .af-preu-row select { flex: 0 0 200px; }
        .af-preu-row input { flex: 1 1 100px; min-width: 80px; }
        .af-preu-unit { font-size: 14px; font-weight: 600; color: var(--muted); }
        .af-img-preview {
          width: 180px; height: 120px; border-radius: 10px;
          border: 2px dashed var(--crema-fosca, #eae2d1);
          background: #fbfcfb; display: flex; align-items: center;
          justify-content: center; overflow: hidden; position: relative; flex-shrink: 0;
        }
        .af-section-title {
          font-size: 13px; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--verd-fosc); margin: 0 0 16px;
        }
        .af-hint { font-size: 13px; color: var(--muted); margin: 0; }
        .af-helper { font-size: 13px; color: var(--muted); font-style: italic; margin: 0; }
        .af-toast-wrap {
          position: fixed; top: 24px; right: 24px; z-index: 99999;
          width: calc(100% - 48px); max-width: 420px; pointer-events: none;
        }
        @media (max-width: 768px) {
          .af-outer { padding-bottom: 80px; }
          .af-header { padding: 20px 16px 0; border-radius: 0; border: none; border-bottom: none; }
          .af-page-title { font-size: 24px; }
          .af-tab { padding: 12px 12px; font-size: 13px; }
          .af-tab-long { display: none; }
          .af-tab-short { display: inline; }
          .af-form { border-radius: 0; border: none; }
          .af-panel { padding: 20px 16px; gap: 20px; }
          .af-row-2 { grid-template-columns: 1fr; gap: 16px; }
          .af-row-3 { grid-template-columns: 1fr; gap: 16px; }
          .af-bottom-bar { padding: 10px 12px; gap: 8px; justify-content: stretch; }
          .af-btn-cancel { display: none; }
          .af-btn-preview { padding: 10px 12px; flex-shrink: 0; }
          .af-btn-preview-text { display: none; }
          .af-btn-save { flex: 1; justify-content: center; }
          .af-preu-row select { flex: 0 0 100%; }
          .af-toast-wrap { top: 16px; right: 8px; left: 8px; width: auto; max-width: none; }
        }
      `}} />

      {/* â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {toast && (
        <div className="af-toast-wrap">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* â”€â”€ Preview modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showPreview && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          overflowY: "auto",
        }}>
          <div style={{
            background: "var(--crema, #f5f0e8)", minHeight: "100vh",
            maxWidth: "1200px", margin: "0 auto", position: "relative",
          }}>
            {/* Close bar */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              background: "white", borderBottom: "1px solid var(--crema-fosca)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                PREVISUALITZACIÃ“ (esborrany)
              </span>
              <button onClick={() => setShowPreview(false)} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid var(--crema-fosca)", background: "white",
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
                color: "var(--fosc)", fontFamily: "inherit",
              }}>
                <X size={16} /> Tancar previsualitzaciÃ³
              </button>
            </div>

            {/* Preview hero */}
            <div style={{ position: "relative", height: "340px", background: "var(--verd-fosc)", overflow: "hidden" }}>
              {imatgeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imatgeUrl} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "40px" }}>
                <div>
                  {categoria && <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>{categoria}</span>}
                  <h1 style={{ color: "white", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "48px", margin: 0, lineHeight: 1.1 }}>{nom || "Sense tÃ­tol"}</h1>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: "8px 0 0" }}>{barri === "__nova_poblacio__" ? customPoblacio : barri}</p>
                </div>
              </div>
            </div>

            {/* Preview body */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", padding: "40px", maxWidth: "1100px", margin: "0 auto" }} className="detail-col-right">
              {/* Left */}
              <div>
                {descripcio && (
                  <div style={{ background: "white", borderRadius: "12px", padding: "28px", marginBottom: "24px", border: "1px solid var(--crema-fosca)" }}>
                    <h3 style={{ marginTop: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>DescripciÃ³</h3>
                    <div style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--fosc)" }}>
                      {parseMarkdownToReact(descripcio)}
                    </div>
                  </div>
                )}
                {material && (
                  <div style={{ background: "white", borderRadius: "12px", padding: "28px", marginBottom: "24px", border: "1px solid var(--crema-fosca)" }}>
                    <h3 style={{ marginTop: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>Observacions</h3>
                    <div style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--fosc)" }}>{parseMarkdownToReact(material)}</div>
                  </div>
                )}
                {galeria.length > 0 && (
                  <div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>Galeria de Fotos</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
                      {galeria.map((img, idx) => (
                        <div key={idx} style={{ height: "100px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#e5e7eb", border: "1px solid var(--crema-fosca)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Galeria" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right sticky card */}
              <div style={{ background: "white", padding: "32px", borderRadius: "12px", border: "1px solid var(--crema-fosca)", boxShadow: "0 4px 20px rgba(26,107,58,0.03)", position: "sticky", top: "80px", alignSelf: "start" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--verd-fosc)", marginBottom: "24px" }}>
                  <strong style={{ display: "block", fontSize: "12px", textTransform: "uppercase", opacity: 0.5, marginBottom: "6px", letterSpacing: "0.05em", fontWeight: 700, color: "var(--muted)" }}>PREU:</strong>
                  {(() => {
                    let preuText = "GratuÃ¯t";
                    if (priceUnit === "/mes" && priceVal) preuText = `${priceVal} â‚¬/mes`;
                    else if (priceUnit === "/trimestre" && priceVal) preuText = `${priceVal} â‚¬/trimestre`;
                    else if (priceUnit === "/any" && priceVal) preuText = `${priceVal} â‚¬/any`;
                    else if (priceUnit === "gratuit") preuText = "GratuÃ¯t";
                    else if (priceUnit === "personalitzat") preuText = customPrice || "Consultar";
                    if (preuText.includes('/')) {
                      const [priceV, priceU] = preuText.split('/');
                      return <>{priceV} <span style={{ fontSize: "16px", fontWeight: 400, opacity: 0.6 }}>/{priceU}</span></>;
                    }
                    return <>{preuText}</>;
                  })()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px", fontSize: "14px" }}>
                  {qui_imparteix && <div><strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, color: "var(--muted)" }}>Impartit per:</strong>{qui_imparteix}</div>}
                  <div><strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, color: "var(--muted)" }}>Horari:</strong>{horari || "Pendent"}</div>
                  <div><strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, color: "var(--muted)" }}>Dies:</strong>{dies || "Pendent"}</div>
                  {durada && <div><strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, color: "var(--muted)" }}>Durada:</strong>{durada}</div>}
                  {idioma && <div><strong style={{ display: "block", fontSize: "11px", textTransform: "uppercase", opacity: 0.5, color: "var(--muted)" }}>Idioma:</strong>{idioma}</div>}
                </div>
                <div style={{ paddingTop: "24px", borderTop: "1px solid var(--crema-fosca)", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
                  {(initialData?.centreImatgeUrl || centrePreview?.imatgeUrl) && (
                    <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--crema-fosca)", flexShrink: 0, backgroundColor: "#fcfcfc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={initialData?.centreImatgeUrl || centrePreview?.imatgeUrl} alt="Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>{centrePreview?.nom || initialData?.centre || "Nom del Centre"}</h4>
                    {centrePreview && (
                      <div style={{ fontSize: "14px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {centrePreview.adreca && <div>{centrePreview.adreca}</div>}
                        {centrePreview.telefon && <div>{centrePreview.telefon}</div>}
                        {centrePreview.email && <div>{centrePreview.email}</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {centrePreview?.telefon && <div style={{ display: "block", backgroundColor: "var(--verd-fosc)", color: "white", padding: "16px", textAlign: "center", borderRadius: "4px", fontWeight: 700 }}>ðŸ“ž {centrePreview.telefon}</div>}
                  {centrePreview?.email && <div style={{ display: "block", backgroundColor: "var(--verd-fosc)", color: "white", padding: "16px", textAlign: "center", borderRadius: "4px", fontWeight: 700 }}>âœ‰ Envia un correu</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Main layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="af-outer">
        {/* Back link */}
        <Link href="/dashboard" className="af-back-link">
          <ArrowLeft size={16} />
          Tornar a les meves activitats
        </Link>

        {/* Header card */}
        <div className="af-header">
          <div className="af-title-row">
            <div>
              <p className="af-kicker">
                {initialData ? "Editar activitat" : "Nova activitat"}
              </p>
              <h1 className="af-page-title">{nom || title}</h1>
            </div>
            <span className={`af-status ${initialData?.publicada ? "af-status--pub" : "af-status--nopub"}`}>
              â— {initialData?.publicada ? "Publicada" : "No publicada"}
            </span>
          </div>

          {/* Tab navigation */}
          <nav className="af-tabs" role="tablist">
            {TABS.map((tab, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={activeTab === i}
                className={`af-tab${activeTab === i ? " af-tab--active" : ""}`}
                onClick={() => setActiveTab(i)}
              >
                <span className="af-tab-long">{tab.long}</span>
                <span className="af-tab-short">{tab.short}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="af-form">
          <input type="hidden" name="centreId" value={selectedCentreId} />

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TAB 0: INFORMACIÃ“ BÃ€SICA
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div role="tabpanel" hidden={activeTab !== 0} className="af-panel">
            {/* Admin: selector de centre */}
            {isAdmin && !initialData && allCentres && allCentres.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, rgba(217,87,56,0.06), rgba(217,87,56,0.02))", border: "1.5px solid rgba(217,87,56,0.25)", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{ background: "rgba(217,87,56,0.12)", color: "#d95738", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>âš™ Admin</span>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--verd-fosc)", margin: 0 }}>Crea l&apos;activitat per a un centre</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={labelStyle}>Selecciona el Centre *</label>
                  <input type="text" placeholder="Cerca per nom de centre..." value={centreSearch} onChange={e => setCentreSearch(e.target.value)}
                    style={{ padding: "10px 14px", border: "1px solid rgba(26,107,58,0.25)", borderRadius: "8px", fontSize: "14px", outline: "none", background: "white" }} />
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(26,107,58,0.15)", borderRadius: "10px", background: "white" }}>
                    {(allCentres ?? [])
                      .filter(c => !centreSearch || c.nom?.toLowerCase().includes(centreSearch.toLowerCase()))
                      .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
                      .map(c => (
                        <div key={c.id} onClick={() => { setSelectedCentreId(c.id || ""); setCentreSearch(c.nom || ""); }}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(26,107,58,0.06)", fontSize: "14px", background: selectedCentreId === c.id ? "rgba(26,107,58,0.08)" : "transparent", fontWeight: selectedCentreId === c.id ? 700 : 400, color: "var(--fosc)" }}>
                          {c.nom}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* NOM */}
            <div style={fieldGroupStyle}>
              <label htmlFor="nom" style={labelStyle}>Nom de l&apos;activitat *</label>
              <input id="nom" type="text" value={nom}
                onChange={e => { setNom(e.target.value); if (e.target.value.trim()) setValidationErrors(p => ({ ...p, nom: false })); }}
                placeholder="Ex: Escola de Futbol, AnglÃ¨s AvanÃ§at..."
                disabled={loading} style={fieldStyle(validationErrors.nom)} />
              {validationErrors.nom && errMsg("* El nom de l'activitat Ã©s obligatori")}
            </div>

            {/* CATEGORIA + TIPUS + BARRI */}
            <div className="af-row-3">
              <div style={fieldGroupStyle}>
                <label htmlFor="categoria" style={labelStyle}>Categoria *</label>
                <select id="categoria" value={categoria}
                  onChange={e => handleCategoriaChange(e.target.value)}
                  disabled={loading} style={{ ...fieldStyle(validationErrors.categoria), cursor: "pointer" }}>
                  <option value="">-- Tria una categoria --</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {validationErrors.categoria && errMsg("* Selecciona una categoria")}
              </div>

              <div style={fieldGroupStyle}>
                <label htmlFor="tipus" style={labelStyle}>Tipus d&apos;activitat *</label>
                <select id="tipus" value={tipus}
                  onChange={e => setTipus(e.target.value)}
                  disabled={loading} style={{ ...fieldStyle(), cursor: "pointer" }}>
                  <option value="Extraescolar">Extraescolar (Setmanal / Curs anual)</option>
                  <option value="Casal">Casal (Estiu, Nadal, Setmana Santa)</option>
                  <option value="Taller">Taller o Oci (MonogrÃ fic, puntual)</option>
                </select>
              </div>

              <div style={fieldGroupStyle}>
                <label htmlFor="barri" style={labelStyle}>Barri de Girona *</label>
                <select id="barri" value={barri}
                  onChange={e => handleFieldChange("barri", e.target.value, setBarri)}
                  disabled={loading} style={{ ...fieldStyle(validationErrors.barri), cursor: "pointer" }}>
                  <option value="">-- Tria un barri --</option>
                  <optgroup label="Barris de Girona">
                    {barris.girona.map(b => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                  {barris.altres.length > 0 && (
                    <optgroup label="Altres poblacions">
                      {barris.altres.map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                  )}
                  {isAdmin && <option value="__nova_poblacio__" style={{ fontWeight: 600, color: "var(--verd-fosc)" }}>ï¼‹ Afegir nova poblaciÃ³...</option>}
                </select>
                {isAdmin && barri === "__nova_poblacio__" && (
                  <input type="text" placeholder="Escriu el nom de la nova poblaciÃ³..."
                    value={customPoblacio} onChange={e => setCustomPoblacio(e.target.value)}
                    style={{ ...fieldStyle(validationErrors.barri), marginTop: "8px", background: "#f0fdf4" }} autoFocus />
                )}
                {validationErrors.barri && errMsg("* Selecciona un barri")}
              </div>
            </div>

            {/* SUBCATEGORIA (Esports / Idiomes) */}
            {(categoria === "Esports" || categoria === "Idiomes") && (
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{TXT_SUBCATEGORIA}</label>
                {predefinedSubs ? (
                  <>
                    <select value={subSelectValue}
                      onChange={e => { setSubSelectValue(e.target.value); if (e.target.value !== "Altres") setCustomSubValue(""); }}
                      disabled={loading} style={{ ...fieldStyle(), cursor: "pointer" }}>
                      <option value="">-- Tria una subcategoria --</option>
                      {predefinedSubs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      <option value="Altres">{TXT_ALTRA_SUBCATEGORIA}</option>
                    </select>
                    {subSelectValue === "Altres" && (
                      <input type="text" placeholder="Introdueix la subcategoria personalitzada..."
                        value={customSubValue} onChange={e => setCustomSubValue(e.target.value)}
                        disabled={loading} style={fieldStyle()} />
                    )}
                  </>
                ) : (
                  <input type="text" placeholder="Introdueix una subcategoria (opcional)..."
                    value={customSubValue} onChange={e => setCustomSubValue(e.target.value)}
                    disabled={loading} style={fieldStyle()} />
                )}
              </div>
            )}

            <p className="af-helper">Aquesta informaciÃ³ identifica l&apos;activitat dins la guia pÃºblica.</p>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TAB 1: HORARI I PREU
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div role="tabpanel" hidden={activeTab !== 1} className="af-panel">
            {/* DIES */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Dies *</label>

              {/* Extraescolar: day picker buttons */}
              {tipus === "Extraescolar" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p className="af-hint">Tria els dies de la setmana en quÃ¨ es fa l&apos;activitat.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"].map(day => {
                      const sel = selectedWeekdays.includes(day);
                      return (
                        <button key={day} type="button"
                          className={`af-day-btn${sel ? " active" : ""}`}
                          onClick={() => {
                            const newDays = sel ? selectedWeekdays.filter(d => d !== day) : [...selectedWeekdays, day];
                            setSelectedWeekdays(newDays);
                            const joined = joinWeekdays(newDays);
                            setDies(joined);
                            if (joined.trim()) setValidationErrors(p => ({ ...p, dies: false }));
                          }}>{day}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Casal: range or individual */}
              {tipus === "Casal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[["range","ðŸ“… Dates seguides"],["individual","ðŸ“Œ Dies concrets"]].map(([mode, label]) => (
                      <button key={mode} type="button"
                        onClick={() => {
                          setCasalDateMode(mode as "range" | "individual");
                          setDies(mode === "range" ? formatDateRange(startDate, endDate) : formatMultipleDates(multipleDates));
                        }}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: casalDateMode === mode ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)", backgroundColor: casalDateMode === mode ? "rgba(26,107,58,0.05)" : "white", color: "var(--verd-fosc)", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {casalDateMode === "range" ? (
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 180px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>DATA D&apos;INICI</span>
                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); const f = formatDateRange(e.target.value, endDate); setDies(f); if (f.trim()) setValidationErrors(p => ({ ...p, dies: false })); }}
                          style={{ padding: "10px 12px", border: "1px solid rgba(26,107,58,0.2)", borderRadius: "8px", fontSize: "14px", color: "var(--fosc)", outline: "none" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 180px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>DATA DE FI (OPCIONAL)</span>
                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); const f = formatDateRange(startDate, e.target.value); setDies(f); if (f.trim()) setValidationErrors(p => ({ ...p, dies: false })); }}
                          style={{ padding: "10px 12px", border: "1px solid rgba(26,107,58,0.2)", borderRadius: "8px", fontSize: "14px", color: "var(--fosc)", outline: "none" }} />
                      </div>
                    </div>
                  ) : (
                    <MultiDatePicker selectedDates={multipleDates.filter(Boolean)}
                      onChange={newDates => { setMultipleDates(newDates.length > 0 ? newDates : [""]); const f = formatMultipleDates(newDates); setDies(f); if (f.trim()) setValidationErrors(p => ({ ...p, dies: false })); }}
                      disabled={loading} />
                  )}
                </div>
              )}

              {/* Taller: puntual / recurrent */}
              {(tipus === "Taller" || tipus === "Taller / Oci") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[["puntual","âš¡ Taller puntual (Dia Ãºnic)"],["recurrent","ðŸ”„ Taller recurrent (PeriÃ²dic)"]].map(([mode, label]) => (
                      <button key={mode} type="button"
                        onClick={() => {
                          setTallerMode(mode as "puntual" | "recurrent");
                          setDies(mode === "puntual" ? formatSingleDate(singleDate) : buildRecurrentDies(selectedTallerWeekdays, recurrentStart, recurrentEnd));
                        }}
                        style={{ padding: "8px 16px", borderRadius: "8px", border: tallerMode === mode ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)", backgroundColor: tallerMode === mode ? "rgba(26,107,58,0.05)" : "white", color: "var(--verd-fosc)", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {tallerMode === "puntual" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "240px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>DATA DEL TALLER</span>
                      <input type="date" value={singleDate} onChange={e => { setSingleDate(e.target.value); const f = formatSingleDate(e.target.value); setDies(f); if (f.trim()) setValidationErrors(p => ({ ...p, dies: false })); }}
                        style={{ padding: "10px 12px", border: "1px solid rgba(26,107,58,0.2)", borderRadius: "8px", fontSize: "14px", color: "var(--fosc)", outline: "none" }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"].map(day => {
                          const sel = selectedTallerWeekdays.includes(day);
                          return (
                            <button key={day} type="button"
                              className={`af-day-btn${sel ? " active" : ""}`}
                              onClick={() => {
                                const newDays = sel ? selectedTallerWeekdays.filter(d => d !== day) : [...selectedTallerWeekdays, day];
                                setSelectedTallerWeekdays(newDays);
                                const f = buildRecurrentDies(newDays, recurrentStart, recurrentEnd);
                                setDies(f); if (f.trim()) setValidationErrors(p => ({ ...p, dies: false }));
                              }}>{day}</button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>DATA D&apos;INICI (opcional)</span>
                          <input type="date" value={recurrentStart} onChange={e => { setRecurrentStart(e.target.value); setDies(buildRecurrentDies(selectedTallerWeekdays, e.target.value, recurrentEnd)); }}
                            style={{ padding: "10px 12px", border: "1px solid rgba(26,107,58,0.2)", borderRadius: "8px", fontSize: "14px", color: "var(--fosc)", outline: "none" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>DATA DE FI (opcional)</span>
                          <input type="date" value={recurrentEnd} onChange={e => { setRecurrentEnd(e.target.value); setDies(buildRecurrentDies(selectedTallerWeekdays, recurrentStart, e.target.value)); }}
                            style={{ padding: "10px 12px", border: "1px solid rgba(26,107,58,0.2)", borderRadius: "8px", fontSize: "14px", color: "var(--fosc)", outline: "none" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text dies (always editable) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Text dels dies (editable)
                </span>
                <input type="text" id="dies" value={dies}
                  onChange={e => handleFieldChange("dies", e.target.value, setDies)}
                  placeholder="Ex: Dimecres, Del 1 al 31 de juliol..."
                  disabled={loading} style={fieldStyle(validationErrors.dies)} />
                {validationErrors.dies && errMsg("* El text dels dies Ã©s obligatori")}
              </div>
            </div>

            {/* HORARI + EDAT */}
            <div className="af-row-2">
              <div style={fieldGroupStyle}>
                <label htmlFor="horari" style={labelStyle}>Horari *</label>
                <input id="horari" type="text" value={horari}
                  onChange={e => handleFieldChange("horari", e.target.value, setHorari)}
                  placeholder="Ex: 17:00 a 18:30 h" disabled={loading}
                  style={fieldStyle(validationErrors.horari)} />
                {validationErrors.horari && errMsg("* L'horari Ã©s obligatori")}
              </div>
              <div style={fieldGroupStyle}>
                <label htmlFor="edat" style={labelStyle}>Franja d&apos;edats *</label>
                <input id="edat" type="text" value={edat}
                  onChange={e => handleFieldChange("edat", e.target.value, setEdat)}
                  placeholder="Ex: A partir d'11 anys, 6 a 12 anys..."
                  disabled={loading} style={fieldStyle(validationErrors.edat)} />
                {validationErrors.edat && errMsg("* La franja d'edat Ã©s obligatÃ²ria")}
              </div>
            </div>

            {/* PREU */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Preu i facturaciÃ³</label>
              <div className="af-preu-row">
                <select value={priceUnit} onChange={e => setPriceUnit(e.target.value)} disabled={loading}
                  style={{ ...fieldStyle(), cursor: "pointer", flex: "0 0 220px" }}>
                  <option value="/mes">{TXT_MENSUAL}</option>
                  <option value="/trimestre">{TXT_TRIMESTRAL}</option>
                  <option value="/any">{TXT_ANUAL}</option>
                  <option value="gratuit">{TXT_GRATUIT}</option>
                  <option value="personalitzat">{TXT_ALTRES_TEXT}</option>
                </select>
                {priceUnit !== "gratuit" && priceUnit !== "personalitzat" && (
                  <>
                    <input type="number" min="0" step="0.01" value={priceVal}
                      onChange={e => setPriceVal(e.target.value)}
                      placeholder="Ex: 45" disabled={loading}
                      style={{ ...fieldStyle(), flex: "1 1 100px", minWidth: "80px" }} />
                    <span className="af-preu-unit">
                      {priceUnit === "/mes" ? "â‚¬/mes" : priceUnit === "/trimestre" ? "â‚¬/trimestre" : "â‚¬/any"}
                    </span>
                  </>
                )}
                {priceUnit === "personalitzat" && (
                  <input type="text" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                    placeholder="Ex: Consultar preus, Des de 40â‚¬..."
                    disabled={loading} style={{ ...fieldStyle(), flex: 1 }} />
                )}
              </div>
              {priceUnit === "gratuit" && (
                <p style={{ fontSize: "13px", color: "var(--verd)", fontWeight: 600, margin: 0 }}>
                  âœ“ {TXT_ACTIVITAT_GRATUITA}
                </p>
              )}
            </div>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TAB 2: DETALLS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div role="tabpanel" hidden={activeTab !== 2} className="af-panel">
            {/* DESCRIPCIÃ“ */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>DescripciÃ³ detallada</label>
              <RichTextEditor value={descripcio} onChange={setDescripcio} disabled={loading} />
            </div>

            {/* DURADA + RATIO + IDIOMA */}
            <div className="af-row-3">
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Durada de la sessiÃ³</label>
                <input type="text" value={durada} onChange={e => setDurada(e.target.value)}
                  placeholder="Ex: 1 h, 90 min..." disabled={loading} style={fieldStyle()} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>RÃ tio d&apos;alumnes</label>
                <input type="text" value={alumnes} onChange={e => setAlumnes(e.target.value)}
                  placeholder="Ex: MÃ xim 12 xics per grup" disabled={loading} style={fieldStyle()} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Idioma</label>
                <input type="text" value={idioma} onChange={e => setIdioma(e.target.value)}
                  placeholder="Ex: CatalÃ , CastellÃ ..." disabled={loading} style={fieldStyle()} />
              </div>
            </div>

            {/* DATA INICI + QUI IMPARTEIX */}
            <div className="af-row-2">
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Data d&apos;inici</label>
                <input type="text" value={inici} onChange={e => setInici(e.target.value)}
                  placeholder="Ex: 1 d'octubre, setembre 2025..."
                  disabled={loading} style={fieldStyle()} />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Qui ho imparteix?</label>
                <input type="text" value={qui_imparteix} onChange={e => setQuiImparteix(e.target.value)}
                  placeholder="Ex: Professors titulats, Monitors especialitzats..."
                  disabled={loading} style={fieldStyle()} />
              </div>
            </div>

            {/* OBSERVACIONS */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Observacions</label>
              <textarea value={material} onChange={e => setMaterial(e.target.value)} rows={4}
                placeholder="Ex: OpciÃ³ de fer setmanes soltes. 1 setmana: 100â‚¬ Â· 2 setmanes: 190â‚¬"
                disabled={loading}
                style={{ ...fieldStyle(), resize: "vertical", minHeight: "100px", lineHeight: 1.6 }} />
            </div>

            {/* TORNS (Casal) */}
            {tipus === "Casal" && (
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Torns <span style={{ fontWeight: 400, textTransform: "none", fontSize: "12px", color: "var(--muted)" }}>(opcional â€” una lÃ­nia per torn: 22/6/26-26/6/26)</span>
                </label>
                <textarea value={torns} onChange={e => setTorns(e.target.value)} rows={5}
                  placeholder={"22/6/26-26/6/26\n29/6/26-3/7/26\n6/7/26-10/7/26"}
                  disabled={loading}
                  style={{ ...fieldStyle(), resize: "vertical", fontFamily: "monospace", lineHeight: 1.6 }} />
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Format: DD/M/AA-DD/M/AA Â· Es mostrarÃ  agrupat per mesos a la fitxa del casal</p>
              </div>
            )}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              TAB 3: IMATGES
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div role="tabpanel" hidden={activeTab !== 3} className="af-panel">
            {/* IMATGE DESTACADA */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Imatge destacada (principal)</label>
              <p className="af-hint">Es mostrarÃ  com a capÃ§alera a la fitxa detallada de l&apos;activitat.</p>
              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                <div className="af-img-preview">
                  {imatgeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imatgeUrl} alt="Imatge destacada" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImatgeUrl("")} />
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--muted)", padding: "12px" }}>
                      <ImageIcon size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <span style={{ fontSize: "12px", display: "block" }}>{TXT_SENSE_IMATGE}</span>
                    </div>
                  )}
                  {isUploadingFeatured && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 className="animate-spin" size={24} style={{ color: "var(--verd)" }} />
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input type="file" ref={featuredInputRef} onChange={handleFeaturedUpload} accept="image/*" style={{ display: "none" }} />
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => featuredInputRef.current?.click()}
                      disabled={isUploadingFeatured || loading}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "1.5px solid var(--verd)", background: "transparent", color: "var(--verd)", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>
                      <Upload size={16} /> Puja imatge
                    </button>
                    {imatgeUrl && (
                      <button type="button" onClick={handleRemoveFeatured} disabled={isUploadingFeatured || loading}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px", border: "1px solid #dc2626", background: "transparent", color: "#dc2626", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>
                        <Trash2 size={16} /> Eliminar
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Format horitzontal Â· 1200Ã—800 Â· mÃ x 4 MB</p>
                </div>
              </div>
            </div>

            {/* GALERIA */}
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Galeria de fotos</label>
              <p className="af-hint">Afegeix diverses imatges per mostrar la vida diÃ ria de l&apos;activitat en un carrusel.</p>
              {galeria.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
                  {galeria.map((url, idx) => (
                    <div key={idx} style={{ aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--crema-fosca, #eae2d1)", position: "relative", backgroundColor: "#fbfcfb" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Galeria ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => handleRemoveGalleryImage(idx)} />
                      <button type="button" onClick={() => handleRemoveGalleryImage(idx)}
                        style={{ position: "absolute", top: "4px", right: "4px", backgroundColor: "rgba(220,38,38,0.9)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple style={{ display: "none" }} />
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingGallery || loading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "8px", border: "1.5px dashed var(--crema-fosca, #eae2d1)", background: "white", color: "var(--verd)", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}>
                  {isUploadingGallery ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Afegir fotos a la galeria
                </button>
              </div>
            </div>
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
              BOTTOM ACTION BAR (fixed)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="af-bottom-bar">
            <button type="button" className="af-btn-cancel" onClick={() => router.push("/dashboard")}>
              CancelÂ·lar
            </button>
            <button type="button" className="af-btn-preview" onClick={() => setShowPreview(true)} title="Previsualitzar fitxa">
              <Eye size={16} />
              <span className="af-btn-preview-text">Previsualitzar fitxa</span>
            </button>
            <button type="submit" className="af-btn-save" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Desar canvis
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
