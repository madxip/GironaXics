"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Edit2, MapPin, Calendar, CircleDollarSign, Tag, Search, ChevronLeft, ChevronRight, Building2, Copy } from "lucide-react";
import DeleteButton from "./DeleteButton";
import TogglePublicada from "./TogglePublicada";
import { Activitat } from "@/lib/types";

const PAGE_SIZE = 20;

interface Props {
  activitats: Activitat[];
  isAdmin: boolean;
}

export default function ActivitatsTable({ activitats, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCentreFilter, setSelectedCentreFilter] = useState("Tots");

  // Llista de tots els centres únics de les activitats
  const uniqueCentres = useMemo(() => {
    const set = new Set<string>();
    activitats.forEach(a => { if (a.centre) set.add(a.centre); });
    return Array.from(set).sort();
  }, [activitats]);

  // Filtre de cerca i centre
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return activitats.filter(a => {
      const matchQuery = !q || (
        (a.nom && a.nom.toLowerCase().includes(q)) ||
        (a.centre && a.centre.toLowerCase().includes(q))
      );
      const matchCentre = selectedCentreFilter === "Tots" || a.centre === selectedCentreFilter;
      return matchQuery && matchCentre;
    });
  }, [activitats, query, selectedCentreFilter]);

  // Paginació
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleQuery = (val: string) => {
    setQuery(val);
    setPage(1); // Torna a la primera pàgina en cercar
  };

  return (
    <>
      <style>{`
        .act-table-search {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid rgba(26,107,58,0.2);
          border-radius: 10px;
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--fosc);
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .act-table-search:focus {
          border-color: var(--verd);
          box-shadow: 0 0 0 3px rgba(26,107,58,0.08);
        }
        .act-table-search::placeholder { color: var(--muted); }
        .act-page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(26,107,58,0.2);
          background: white;
          color: var(--verd-fosc);
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .act-page-btn:hover:not(:disabled) {
          background: var(--verd-fosc);
          color: white;
          border-color: var(--verd-fosc);
        }
        .act-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .act-page-btn.active {
          background: var(--verd-fosc);
          color: white;
          border-color: var(--verd-fosc);
        }
      `}</style>

      {/* ── Buscador i Filtres ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input
            type="text"
            className="act-table-search"
            placeholder={isAdmin ? "Cerca per nom d'activitat o centre..." : "Cerca per nom d'activitat..."}
            value={query}
            onChange={e => handleQuery(e.target.value)}
            aria-label="Cerca activitats"
          />
        </div>
        {isAdmin && (
          <select
            value={selectedCentreFilter}
            onChange={e => { setSelectedCentreFilter(e.target.value); setPage(1); }}
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(26,107,58,0.2)",
              fontSize: "14px",
              color: "var(--fosc)",
              backgroundColor: "white",
              outline: "none",
              cursor: "pointer",
              minWidth: "200px"
            }}
          >
            <option value="Tots">-- Tots els centres --</option>
            {uniqueCentres.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* ── Resum ── */}
      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>
        {query
          ? `${filtered.length} resultat${filtered.length !== 1 ? "s" : ""} per "${query}"`
          : `${activitats.length} activitat${activitats.length !== 1 ? "s" : ""} en total`
        }
      </div>

      {/* ── Taula desktop ── */}
      <div
        className="dashboard-desktop-table"
        style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", boxShadow: "0 10px 30px rgba(26,107,58,0.02)", overflow: "hidden" }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "15px" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(26,107,58,0.02)", borderBottom: "1px solid var(--verd-pallid)" }}>
                {isAdmin && (
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Building2 size={14} /> Centre
                    </span>
                  </th>
                )}
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Nom de l&apos;Activitat</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Categoria</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Barri</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Edats</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Preu</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)" }}>Estat</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "var(--verd-fosc)", textAlign: "center" }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                    Cap activitat coincideix amb la cerca
                  </td>
                </tr>
              ) : paged.map((act) => (
                <tr key={act.id} style={{ borderBottom: "1px solid var(--crema-fosca)", transition: "background-color 0.2s" }} className="dashboard-table-row">
                  {/* Centre — només admin */}
                  {isAdmin && (
                    <td style={{ padding: "16px 20px", maxWidth: "160px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--verd-fosc)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={act.centre}>
                        {act.centre || "—"}
                      </span>
                    </td>
                  )}

                  {/* Nom */}
                  <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--verd-fosc)" }}>
                    <div>{act.nom}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400, display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <Calendar size={12} /> {act.dies}{act.horari ? ` • ${act.horari}` : ""}
                    </div>
                  </td>

                  {/* Categoria */}
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, padding: "4px 10px", borderRadius: "20px", backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #dcfce7" }}>
                      <Tag size={12} />
                      {(() => {
                        const catsStr = act.categories ? act.categories.join(' • ') : act.categoria;
                        return act.subcategoria ? `${catsStr} • ${act.subcategoria}` : catsStr;
                      })()}
                    </span>
                  </td>

                  {/* Barri */}
                  <td style={{ padding: "16px 20px", color: "var(--fosc)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={14} style={{ color: "var(--verd)" }} />
                      {act.barri}
                    </span>
                  </td>

                  {/* Edats */}
                  <td style={{ padding: "16px 20px", color: "var(--muted)", fontWeight: 500 }}>{act.edat}</td>

                  {/* Preu */}
                  <td style={{ padding: "16px 20px", color: "var(--fosc)", fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CircleDollarSign size={14} style={{ color: "var(--verd)" }} />
                      {act.preu ? `${act.preu}€` : "N/A"}
                    </span>
                  </td>

                  {/* Estat */}
                  <td style={{ padding: "16px 20px" }}>
                    <TogglePublicada id={act.id!} initialPublicada={act.publicada} />
                  </td>

                  {/* Accions */}
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      <Link href={`/dashboard/activitats/nova?duplicateFrom=${act.id}`} title="Duplicar activitat" className="dashboard-action-btn" style={{ color: "var(--verd)" }}>
                        <Copy size={16} />
                      </Link>
                      <Link href={`/dashboard/activitats/${act.id}/editar`} title="Editar activitat" className="dashboard-action-btn">
                        <Edit2 size={16} />
                      </Link>
                      <DeleteButton id={act.id!} nom={act.nom} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Paginació ── */}
        {totalPages > 1 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--crema-fosca)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>
              Pàgina {page} de {totalPages} · {filtered.length} activitats
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button className="act-page-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="Primera pàgina">«</button>
              <button className="act-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Pàgina anterior">
                <ChevronLeft size={14} />
              </button>
              {/* Números de pàgina */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} className={`act-page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                );
              })}
              <button className="act-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Pàgina següent">
                <ChevronRight size={14} />
              </button>
              <button className="act-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Última pàgina">»</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Targetes mòbil ── */}
      <div className="dashboard-mobile-list">
        {paged.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
            Cap activitat coincideix amb la cerca
          </div>
        ) : paged.map((act) => (
          <div key={act.id} className="dashboard-mobile-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                {isAdmin && (
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#d95738", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    {act.centre}
                  </div>
                )}
                <h3 className="dashboard-mobile-card-title">{act.nom}</h3>
              </div>
              <div style={{ flexShrink: 0 }}>
                <TogglePublicada id={act.id!} initialPublicada={act.publicada} />
              </div>
            </div>
            <div className="dashboard-mobile-card-meta">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={14} style={{ color: "var(--verd)" }} />
                <span>{act.dies}{act.horari ? ` • ${act.horari}` : ""}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={14} style={{ color: "var(--verd)" }} />
                <span>{act.barri}</span>
              </div>
            </div>
            <div className="dashboard-mobile-card-footer">
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                {(() => {
                  const catsStr = act.categories ? act.categories.join(' · ') : act.categoria;
                  return act.subcategoria ? `${catsStr} · ${act.subcategoria}` : catsStr;
                })()}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link href={`/dashboard/activitats/nova?duplicateFrom=${act.id}`} title="Duplicar" className="dashboard-action-btn" style={{ padding: "8px 10px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--verd)" }}>
                  <Copy size={14} /><span>Duplica</span>
                </Link>
                <Link href={`/dashboard/activitats/${act.id}/editar`} title="Editar" className="dashboard-action-btn" style={{ padding: "8px 10px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Edit2 size={14} /><span>Editar</span>
                </Link>
                <DeleteButton id={act.id!} nom={act.nom} />
              </div>
            </div>
          </div>
        ))}

        {/* Paginació mòbil */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Pàgina {page} de {totalPages}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="act-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></button>
              <button className="act-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
