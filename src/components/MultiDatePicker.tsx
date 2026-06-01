"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Trash2 } from "lucide-react";

interface MultiDatePickerProps {
  selectedDates: string[]; // YYYY-MM-DD strings
  onChange: (dates: string[]) => void;
  disabled?: boolean;
}

const MONTHS_CA = [
  "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
  "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
];

const WEEKDAYS_CA = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];

export default function MultiDatePicker({
  selectedDates = [],
  onChange,
  disabled = false
}: MultiDatePickerProps) {
  // Inicialitzem el mes/any visualitzat en el primer element seleccionat o en la data actual
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDates.length > 0 && selectedDates[0]) {
      return new Date(selectedDates[0]);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper per a fer el pad de dígits (ex: "5" -> "05")
  const pad = (n: number) => String(n).padStart(2, "0");

  // Formatador de dates intern a cadena YYYY-MM-DD en hora local
  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  // Càlcul de dies en el mes actiu i el seu offset de setmana (Dilluns com a primer dia)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const toggleDate = (day: number) => {
    if (disabled) return;
    const dateStr = formatDateString(year, month, day);
    let newDates = [];

    if (selectedDates.includes(dateStr)) {
      newDates = selectedDates.filter(d => d !== dateStr);
    } else {
      newDates = [...selectedDates, dateStr];
    }

    // Ordenem cronològicament per assegurar que el text generat estigui endreçat
    newDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    onChange(newDates);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Generem les cel·les per a la quadrícula del calendari
  const cells = [];
  // Cel·les buides del mes anterior (offset)
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} style={{ height: "40px" }} />);
  }
  // Cel·les del mes en curs
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateString(year, month, d);
    const isSelected = selectedDates.includes(dateStr);
    cells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => toggleDate(d)}
        disabled={disabled}
        style={{
          height: "40px",
          width: "100%",
          borderRadius: "50%",
          border: "none",
          backgroundColor: isSelected ? "var(--verd)" : "transparent",
          color: isSelected ? "white" : "var(--fosc)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: isSelected ? "700" : "500",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          position: "relative"
        }}
        className={`calendar-day-btn ${isSelected ? "selected" : ""}`}
      >
        {d}
      </button>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(26, 107, 58, 0.15)",
        borderRadius: "12px",
        padding: "16px",
        backgroundColor: "white",
        maxWidth: "340px",
        boxShadow: "0 4px 12px rgba(26, 107, 58, 0.04)"
      }}
    >
      {/* CAPÇALERA DEL CALENDARI */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px"
        }}
      >
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={disabled}
          style={{
            border: "1px solid var(--crema-fosca)",
            borderRadius: "8px",
            backgroundColor: "white",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "var(--verd-fosc)",
            transition: "all 0.2s"
          }}
          className="calendar-nav-btn"
        >
          <ChevronLeft size={16} />
        </button>

        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "16px",
            fontWeight: "700",
            color: "var(--verd-fosc)"
          }}
        >
          {MONTHS_CA[month]} {year}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={disabled}
          style={{
            border: "1px solid var(--crema-fosca)",
            borderRadius: "8px",
            backgroundColor: "white",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "var(--verd-fosc)",
            transition: "all 0.2s"
          }}
          className="calendar-nav-btn"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* QUADRÍCULA DELS DIES DE LA SETMANA */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          textAlign: "center",
          marginBottom: "8px"
        }}
      >
        {WEEKDAYS_CA.map(day => (
          <div
            key={day}
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "var(--muted)",
              fontFamily: "var(--font-sans)",
              paddingBottom: "4px"
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* QUADRÍCULA DELS DIES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px"
        }}
      >
        {cells}
      </div>

      {/* RESUM I NETEJA */}
      {selectedDates.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid var(--crema-fosca)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
            color: "var(--muted)"
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} style={{ color: "var(--verd)" }} />
            {selectedDates.length} {selectedDates.length === 1 ? "dia seleccionat" : "dies seleccionats"}
          </span>
          
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            style={{
              border: "none",
              backgroundColor: "transparent",
              color: "#dc2626",
              cursor: "pointer",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all 0.2s"
            }}
            className="calendar-clear-btn"
          >
            <Trash2 size={13} />
            Netejar
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .calendar-nav-btn:hover {
          background-color: var(--crema-fosca) !important;
          border-color: var(--verd) !important;
        }
        .calendar-day-btn:not(.selected):hover {
          background-color: var(--crema-fosca) !important;
          color: var(--verd) !important;
        }
        .calendar-clear-btn:hover {
          background-color: #fef2f2 !important;
        }
      `}} />
    </div>
  );
}
