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
  initialData?: Partial<Activitat>;
  categories: string[];
  subcategories?: Map<string, string[]>;
  submitAction: (prevState: unknown, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  title: string;
  centre?: Centre;
  allCentres?: Centre[];
  isAdmin?: boolean;
  poblacions?: Record<string, string[]>;
  initialCentreId?: string;
}

const PREDEFINED_SUBCATEGORIES: Map<string, string[]> = new Map([
  ["Esports", ["Futbol", "Bàsquet", "Ciclisme", "Natació", "Atletisme", "Patinatge", "Arts marcials", "Gimnàstica", "Tennis / Pàdel"]],
  ["Idiomes", ["Anglès", "Francès", "Alemany"]]
]);

const safeGetSubcategories = (cat: string | undefined, dynamicSubs?: Map<string, string[]>): string[] | undefined => {
  if (!cat || typeof cat !== "string") return undefined;
  // Primer intenta les subcategories dinàmiques d'Airtable
  if (dynamicSubs && dynamicSubs.size > 0) {
    return dynamicSubs.get(cat) || undefined;
  }
  // Fallback al llistat hardcoded
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

export default function ActivityForm({ initialData = {}, categories, subcategories, submitAction, title, centre, allCentres, isAdmin = false, poblacions, initialCentreId }: ActivityFormProps) {
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
  
  const getInitialCategories = (): string[] => {
    if (initialData) {
      if (initialData.categories && initialData.categories.length > 0) {
        return initialData.categories;
      }
      if (initialData.categoria) {
        return Array.isArray(initialData.categoria) ? initialData.categoria : [initialData.categoria];
      }
    }
    return [];
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>(getInitialCategories());
  
  // Localització personalitzada (override)
  const initialPoblacio = initialData?.poblacio_propia || "";
  const [hasCustomLocation, setHasCustomLocation] = useState(!!initialPoblacio);
  const [customComarca, setCustomComarca] = useState("");
  const [customPoblacio, setCustomPoblacio] = useState(initialPoblacio);

  // Carrega la comarca a partir del barri/població inicial
  React.useEffect(() => {
    if (initialPoblacio && poblacions) {
      for (const [comarcaName, towns] of Object.entries(poblacions)) {
        if (towns.includes(initialPoblacio)) {
          setCustomComarca(comarcaName);
          break;
        }
      }
    }
  }, [initialPoblacio, poblacions]);
  // Admin: centre seleccionat quan crea una activitat per a un altre centre
  const [selectedCentreId, setSelectedCentreId] = useState<string>(
    initialCentreId || initialData?.centreId || centre?.id || ""
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
  const hasPredefined = safeGetSubcategories(initialData?.categoria, subcategories);
  const isPredefined = !!(hasPredefined && hasPredefined.includes(initialSub));

  const [subSelectValue, setSubSelectValue] = useState(
    !initialSub ? "" : (isPredefined ? initialSub : "Altres")
  );
  const [customSubValue, setCustomSubValue] = useState(
    isPredefined ? "" : initialSub
  );

  const handleCategoryToggle = (catName: string) => {
    setSelectedCategories(prev => {
      const next = prev.includes(catName)
        ? prev.filter(c => c !== catName)
        : [...prev, catName];
      if (next.length > 0) {
        setValidationErrors(prevErrors => ({ ...prevErrors, categoria: false }));
      }
      return next;
    });
  };

  const predefinedSubs = selectedCategories.includes("Esports")
    ? safeGetSubcategories("Esports", subcategories)
    : (selectedCategories.includes("Idiomes") ? safeGetSubcategories("Idiomes", subcategories) : undefined);
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
    if (selectedCategories.length === 0) errors.categoria = true;
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
      selectedCategories.forEach(c => {
        formData.append("categoria", c);
      });
      
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
      
      const finalPoblacioPropia = hasCustomLocation ? customPoblacio : "";
      formData.append("poblacio_propia", finalPoblacioPropia);
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
      {/* Toast */}
      {toast && (
        <div className="af-toast-wrap">
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Preview modal */}
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
            <div style={{
              position: "sticky", top: 0, zIndex: 10, background: "white",
              borderBottom: "1px solid var(--crema-fosca)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px",
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {"PREVISUALITZACI\u00d3 (esborrany)"}
              </span>
              <button onClick={() => setShowPreview(false)} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid var(--crema-fosca)", background: "white",
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
                color: "var(--fosc)", fontFamily: "inherit",
              }}>
                <X size={16} /> {"Tancar previsualitzaci\u00f3"}
              </button>
            </div>
            <div style={{ position: "relative", height: "340px", background: "var(--verd-fosc)", overflow: "hidden" }}>
              {imatgeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imatgeUrl} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "40px" }}>
                <div>
                  {selectedCategories.length > 0 && <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>{selectedCategories.join(', ')}</span>}
                  <h1 style={{ color: "white", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "48px", margin: 0, lineHeight: 1.1 }}>{nom || "Sense títol"}</h1>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: "8px 0 0" }}>
                    {(allCentres?.find(c => c.id === selectedCentreId) || centre)?.barri || ""}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
              <div>
                {descripcio && (
                  <div style={{ background: "white", borderRadius: "12px", padding: "28px", marginBottom: "24px", border: "1px solid var(--crema-fosca)" }}>
                    <h3 style={{ marginTop: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>{"Descripci\u00f3"}</h3>
                    <div style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--fosc)" }}>{parseMarkdownToReact(descripcio)}</div>
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
                        <div key={idx} style={{ height: "100px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Galeria" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ background: "white", padding: "32px", borderRadius: "12px", border: "1px solid var(--crema-fosca)", position: "sticky", top: "80px", alignSelf: "start" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--verd-fosc)", marginBottom: "24px" }}>
                  <strong style={{ display: "block", fontSize: "12px", textTransform: "uppercase", opacity: 0.5, marginBottom: "6px", letterSpacing: "0.05em", fontWeight: 700 }}>PREU:</strong>
                  {(() => {
                    let preuText = "A consultar";
                    if (priceUnit === "/mes" && priceVal) preuText = `${priceVal} \u20ac/mes`;
                    else if (priceUnit === "/trimestre" && priceVal) preuText = `${priceVal} \u20ac/trimestre`;
                    else if (priceUnit === "/any" && priceVal) preuText = `${priceVal} \u20ac/any`;
                    else if (priceUnit === "gratuit") preuText = "Gratu\u00eft";
                    else if (priceUnit === "personalitzat") preuText = customPrice || "A consultar";
                    if (preuText.includes("/")) {
                      const [priceV, priceU] = preuText.split("/");
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
                    <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--crema-fosca)", flexShrink: 0, backgroundColor: "#fcfcfc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={initialData?.centreImatgeUrl || centrePreview?.imatgeUrl} alt="Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>{centrePreview?.nom || initialData?.centre || "Nom del Centre"}</h4>
                    {centrePreview && (
                      <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                        {centrePreview.adreca && <div>{centrePreview.adreca}</div>}
                        {centrePreview.telefon && <div>{centrePreview.telefon}</div>}
                        {centrePreview.email && <div>{centrePreview.email}</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {centrePreview?.telefon && <div style={{ backgroundColor: "var(--verd-fosc)", color: "white", padding: "16px", textAlign: "center", borderRadius: "4px", fontWeight: 700 }}>{centrePreview.telefon}</div>}
                  {centrePreview?.email && <div style={{ backgroundColor: "var(--verd-fosc)", color: "white", padding: "16px", textAlign: "center", borderRadius: "4px", fontWeight: 700 }}>Envia un correu</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="af-outer">
        {/* Back link */}
        <Link href="/dashboard" className="af-back-link">
          <ArrowLeft size={16} />
          Tornar a les meves activitats
        </Link>

        {/* ── Unified white card ────────────────────────────── */}
        <div className="af-card">

          {/* Title + badge (border-bottom creates the separator line) */}
          <div className="af-card-top">
            <div>
              <p className="af-kicker">
                {initialData ? "Editar activitat" : "Nova activitat"}
              </p>
              <h1 className="af-page-title">{nom || title}</h1>
            </div>
            <span className={`af-status ${initialData?.publicada ? "af-status--pub" : "af-status--nopub"}`}>
              {"\u25cf"} {initialData?.publicada ? "Publicada" : "No publicada"}
            </span>
          </div>

          {/* Tab navigation (border-bottom creates the line under tabs) */}
          <div className="af-tabs" role="tablist">
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
          </div>

          {/* Form with tab panels + fixed bottom bar */}
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="centreId" value={selectedCentreId} />

            {/* ══ TAB 0: INFORMACI\u00d3 B\u00c0SICA ══════════════════════════════ */}
            <div role="tabpanel" style={{ display: activeTab === 0 ? 'flex' : 'none', flexDirection: 'column', gap: '24px', padding: '32px' }}>

              {/* Admin: selector de centre */}
              {isAdmin && !initialData && allCentres && allCentres.length > 0 && (
                <div style={{ background: "linear-gradient(135deg, rgba(217,87,56,0.06), rgba(217,87,56,0.02))", border: "1.5px solid rgba(217,87,56,0.25)", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <span style={{ background: "rgba(217,87,56,0.12)", color: "#d95738", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Admin</span>
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

              {/* NOM DE L'ACTIVITAT */}
              <div style={fieldGroupStyle}>
                <label htmlFor="nom" style={labelStyle}>Nom de l&apos;activitat *</label>
                <input id="nom" type="text" value={nom}
                  onChange={e => { setNom(e.target.value); if (e.target.value.trim()) setValidationErrors(p => ({ ...p, nom: false })); }}
                  placeholder={"Ex: Escola de Futbol, Angl\u00e8s Avan\u00e7at..."}
                  disabled={loading} style={fieldStyle(validationErrors.nom)} />
                {validationErrors.nom && errMsg("* El nom de l\u2019activitat \u00e9s obligatori")}
              </div>

              {/* CATEGORIA + TIPUS */}
              <div className="af-row-2">
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Categories *</label>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
                    gap: "10px", 
                    padding: "15px", 
                    background: "var(--crema-fosca)", 
                    borderRadius: "10px", 
                    border: validationErrors.categoria ? "1.5px solid #d93025" : "1px solid rgba(26,107,58,0.15)",
                    maxHeight: "220px",
                    overflowY: "auto"
                  }}>
                    {categories.map(c => {
                      const isChecked = selectedCategories.includes(c);
                      return (
                        <label key={c} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          fontSize: "13px", 
                          fontWeight: 500, 
                          color: "var(--verd-fosc)", 
                          cursor: "pointer",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: isChecked ? "rgba(26,107,58,0.08)" : "transparent",
                          transition: "background 0.2s"
                        }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleCategoryToggle(c)} 
                            style={{ 
                              cursor: "pointer",
                              accentColor: "var(--verd)"
                            }}
                          />
                          {c}
                        </label>
                      );
                    })}
                  </div>
                  {validationErrors.categoria && errMsg("* Selecciona com a mínim una categoria")}
                </div>

                <div style={fieldGroupStyle}>
                  <label htmlFor="tipus" style={labelStyle}>Tipus d&apos;activitat *</label>
                  <select id="tipus" value={tipus}
                    onChange={e => setTipus(e.target.value)}
                    disabled={loading} style={{ ...fieldStyle(), cursor: "pointer" }}>
                    <option value="Extraescolar">Extraescolar (Setmanal / Curs anual)</option>
                    <option value="Casal">Casal (Estiu, Nadal, Setmana Santa)</option>
                    <option value="Taller">{"Taller o Oci (Monogr\u00e0fic, puntual)"}</option>
                  </select>
                </div>
              </div>

              {/* SUBCATEGORIA */}
              {(selectedCategories.includes("Esports") || selectedCategories.includes("Idiomes")) && (
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

              {/* LOCALITZACIÓ PERSONALITZADA (OVERRIDE DE POBLACIÓ) */}
              <div style={{ marginTop: "12px", borderTop: "1px solid rgba(26,107,58,0.1)", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <input
                    type="checkbox"
                    id="override-location"
                    checked={hasCustomLocation}
                    onChange={e => {
                      setHasCustomLocation(e.target.checked);
                      if (!e.target.checked) {
                        setCustomComarca("");
                        setCustomPoblacio("");
                      }
                    }}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "var(--verd)"
                    }}
                  />
                  <label htmlFor="override-location" style={{ fontSize: "14px", fontWeight: 600, color: "var(--verd-fosc)", cursor: "pointer" }}>
                    Aquesta activitat s&apos;imparteix en una població o barri diferent del centre
                  </label>
                </div>

                {hasCustomLocation && poblacions && (
                  <div className="af-row-2" style={{ marginTop: "16px", animation: "fadeIn 0.2s ease" }}>
                    <div style={fieldGroupStyle}>
                      <label htmlFor="custom-comarca" style={labelStyle}>Comarca de l&apos;activitat *</label>
                      <select
                        id="custom-comarca"
                        value={customComarca}
                        onChange={e => {
                          setCustomComarca(e.target.value);
                          setCustomPoblacio("");
                        }}
                        style={{ ...fieldStyle(), cursor: "pointer" }}
                        required={hasCustomLocation}
                      >
                        <option value="">-- Tria una comarca --</option>
                        {Object.keys(poblacions).sort().map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div style={fieldGroupStyle}>
                      <label htmlFor="custom-poblacio" style={labelStyle}>Municipi o Barri de l&apos;activitat *</label>
                      <select
                        id="custom-poblacio"
                        value={customPoblacio}
                        onChange={e => setCustomPoblacio(e.target.value)}
                        style={{
                          ...fieldStyle(),
                          cursor: !customComarca ? "not-allowed" : "pointer",
                          backgroundColor: !customComarca ? "#f9f9f9" : "white"
                        }}
                        disabled={!customComarca}
                        required={hasCustomLocation}
                      >
                        <option value="">-- Tria un municipi o barri --</option>
                        {(poblacions[customComarca] || []).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <p className="af-helper">{"Aquesta informaci\u00f3 identifica l'activitat dins la guia p\u00fablica."}</p>
            </div>

            {/* ══ TAB 1: HORARI I PREU ══════════════════════════════════ */}
            <div role="tabpanel" style={{ display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '24px', padding: '32px' }}>

              {/* DIES */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Dies *</label>

                {/* Extraescolar: selector de dies setmanals */}
                {tipus === "Extraescolar" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p className="af-hint">{"Tria els dies de la setmana en qu\u00e8 es fa l'activitat."}</p>
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

                {/* Casal: mode rang o dies individuals */}
                {tipus === "Casal" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {[["range","Dates seguides"],["individual","Dies concrets"]].map(([mode, label]) => (
                        <button key={mode} type="button"
                          onClick={() => {
                            setCasalDateMode(mode as "range" | "individual");
                            setDies(mode === "range" ? formatDateRange(startDate, endDate) : formatMultipleDates(multipleDates));
                          }}
                          style={{ padding: "8px 16px", borderRadius: "8px", border: casalDateMode === mode ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)", backgroundColor: casalDateMode === mode ? "rgba(26,107,58,0.05)" : "white", color: "var(--verd-fosc)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
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

                {/* Taller: puntual o recurrent */}
                {(tipus === "Taller" || tipus === "Taller / Oci") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {[["puntual","Taller puntual (Dia \u00fanic)"],["recurrent","Taller recurrent (Peri\u00f2dic)"]].map(([mode, label]) => (
                        <button key={mode} type="button"
                          onClick={() => {
                            setTallerMode(mode as "puntual" | "recurrent");
                            setDies(mode === "puntual" ? formatSingleDate(singleDate) : buildRecurrentDies(selectedTallerWeekdays, recurrentStart, recurrentEnd));
                          }}
                          style={{ padding: "8px 16px", borderRadius: "8px", border: tallerMode === mode ? "2px solid var(--verd)" : "1px solid var(--crema-fosca)", backgroundColor: tallerMode === mode ? "rgba(26,107,58,0.05)" : "white", color: "var(--verd-fosc)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
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

                {/* Text dels dies (sempre visible, editable) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Text dels dies (editable)
                  </span>
                  <input type="text" id="dies" value={dies}
                    onChange={e => handleFieldChange("dies", e.target.value, setDies)}
                    placeholder="Ex: Dimecres, Del 1 al 31 de juliol..."
                    disabled={loading} style={fieldStyle(validationErrors.dies)} />
                  {validationErrors.dies && errMsg("* El text dels dies \u00e9s obligatori")}
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
                  {validationErrors.horari && errMsg("* L\u2019horari \u00e9s obligatori")}
                </div>
                <div style={fieldGroupStyle}>
                  <label htmlFor="edat" style={labelStyle}>Franja d&apos;edats *</label>
                  <input id="edat" type="text" value={edat}
                    onChange={e => handleFieldChange("edat", e.target.value, setEdat)}
                    placeholder="Ex: A partir d'11 anys, 6 a 12 anys..."
                    disabled={loading} style={fieldStyle(validationErrors.edat)} />
                  {validationErrors.edat && errMsg("* La franja d\u2019edat \u00e9s obligat\u00f2ria")}
                </div>
              </div>

              {/* PREU I FACTURACI\u00d3 */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{"Preu i facturaci\u00f3"}</label>
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
                        {priceUnit === "/mes" ? "\u20ac/mes" : priceUnit === "/trimestre" ? "\u20ac/trimestre" : "\u20ac/any"}
                      </span>
                    </>
                  )}
                  {priceUnit === "personalitzat" && (
                    <input type="text" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                      placeholder={"Ex: Consultar preus, Des de 40\u20ac..."}
                      disabled={loading} style={{ ...fieldStyle(), flex: 1 }} />
                  )}
                </div>
                {priceUnit === "gratuit" && (
                  <p style={{ fontSize: "13px", color: "var(--verd)", fontWeight: 600, margin: 0 }}>
                    {"\u2713"} {TXT_ACTIVITAT_GRATUITA}
                  </p>
                )}
              </div>
            </div>

            {/* ══ TAB 2: DETALLS ════════════════════════════════════════ */}
            <div role="tabpanel" style={{ display: activeTab === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '24px', padding: '32px' }}>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{"Descripci\u00f3 detallada"}</label>
                <RichTextEditor value={descripcio} onChange={setDescripcio} disabled={loading} />
              </div>

              <div className="af-row-3">
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>{"Durada de la sessi\u00f3"}</label>
                  <input type="text" value={durada} onChange={e => setDurada(e.target.value)}
                    placeholder="Ex: 1 h, 90 min..." disabled={loading} style={fieldStyle()} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>{"R\u00e0tio d'alumnes"}</label>
                  <input type="text" value={alumnes} onChange={e => setAlumnes(e.target.value)}
                    placeholder={"Ex: M\u00e0xim 12 xics per grup"} disabled={loading} style={fieldStyle()} />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Idioma</label>
                  <input type="text" value={idioma} onChange={e => setIdioma(e.target.value)}
                    placeholder={"Ex: Catal\u00e0, Castell\u00e0..."} disabled={loading} style={fieldStyle()} />
                </div>
              </div>

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

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Observacions</label>
                <RichTextEditor value={material} onChange={setMaterial} disabled={loading} />
              </div>

              {tipus === "Casal" && (
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Torns <span style={{ fontWeight: 400, textTransform: "none", fontSize: "12px", color: "var(--muted)" }}>{"(opcional \u2014 una l\u00ednia per torn: 22/6/26-26/6/26)"}</span>
                  </label>
                  <textarea value={torns} onChange={e => setTorns(e.target.value)} rows={5}
                    placeholder={"22/6/26-26/6/26\n29/6/26-3/7/26\n6/7/26-10/7/26"}
                    disabled={loading}
                    style={{ ...fieldStyle(), resize: "vertical", fontFamily: "monospace", lineHeight: 1.6 }} />
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{"Format: DD/M/AA-DD/M/AA \u00b7 Es mostrar\u00e0 agrupat per mesos a la fitxa del casal"}</p>
                </div>
              )}
            </div>

            {/* ══ TAB 3: IMATGES ════════════════════════════════════════ */}
            <div role="tabpanel" style={{ display: activeTab === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '24px', padding: '32px' }}>

              {/* Imatge destacada */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Imatge destacada (principal)</label>
                <p className="af-hint">{"Es mostrar\u00e0 com a cap\u00e7alera a la fitxa detallada de l'activitat."}</p>
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
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "1.5px solid var(--verd)", background: "transparent", color: "var(--verd)", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        <Upload size={16} /> Puja imatge
                      </button>
                      {imatgeUrl && (
                        <button type="button" onClick={handleRemoveFeatured} disabled={isUploadingFeatured || loading}
                          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px", border: "1px solid #dc2626", background: "transparent", color: "#dc2626", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          <Trash2 size={16} /> Eliminar
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{"Format horitzontal \u00b7 1200\u00d7800 \u00b7 m\u00e0x 4 MB"}</p>
                  </div>
                </div>
              </div>

              {/* Galeria */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Galeria de fotos</label>
                <p className="af-hint">{"Afegeix diverses imatges per mostrar la vida di\u00e0ria de l'activitat en un carrusel."}</p>
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
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "8px", border: "1.5px dashed var(--crema-fosca, #eae2d1)", background: "white", color: "var(--verd)", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {isUploadingGallery ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Afegir fotos a la galeria
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BAR (position: fixed) */}
            <div className="af-bottom-bar">
              <button type="button" className="af-btn-cancel" onClick={() => router.push("/dashboard")}>
                Cancel{"\u00b7"}lar
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
      </div>
    </>
  );
}
