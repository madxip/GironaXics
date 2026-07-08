"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart2,
  TrendingUp,
  Phone,
  Mail,
  MousePointerClick,
  Star,
  Filter,
  MapPin,
  Users,
  RefreshCw,
  Building2,
} from "lucide-react";

// ─── Tipus ───────────────────────────────────────────────────────────────────
interface StatsData {
  isAdmin: boolean;
  totals: {
    activityViews: number;
    contactPhone: number;
    contactEmail: number;
    totalContacts: number;
    sponsorClicks: number;
    casalsBannerClicks: number;
    filterUses: number;
  };
  topActivitats: { label: string; views: number; contacts: number; ratio: number }[];
  topCentres: { label: string; views: number; contacts: number; ratio: number }[];
  topCategories: { label: string; count: number }[];
  topBarris: { label: string; count: number }[];
  topEdats: { label: string; count: number }[];
  topSponsors: { label: string; count: number }[];
  devices: { mobile: number; desktop: number };
}

const PERIOD_OPTIONS = [
  { label: "Avui", value: 1 },
  { label: "7 dies", value: 7 },
  { label: "30 dies", value: 30 },
  { label: "Tot", value: 0 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color = "#1a6b3a", sub }: {
  icon: React.ElementType; label: string; value: number | string; color?: string; sub?: string;
}) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid rgba(26,107,58,0.1)", padding: "24px", boxShadow: "0 4px 20px rgba(26,107,58,0.04)", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--verd-fosc)", lineHeight: 1, fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{value}</div>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "6px", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: "11px", color, fontWeight: 600, marginTop: "4px" }}>{sub}</div>}
      </div>
    </div>
  );
}

function HorizontalBar({ label, count, max, color = "#1a6b3a" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ flex: "0 0 140px", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</div>
      <div style={{ flex: 1, height: "8px", backgroundColor: "rgba(26,107,58,0.08)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "99px", transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      <div style={{ flex: "0 0 36px", fontSize: "13px", fontWeight: 700, color: "var(--verd-fosc)", textAlign: "right" }}>{count}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid rgba(26,107,58,0.1)", padding: "28px", boxShadow: "0 4px 20px rgba(26,107,58,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid rgba(26,107,58,0.06)" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(26,107,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--verd)" }}>
          <Icon size={16} />
        </div>
        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--verd-fosc)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <p style={{ color: "var(--muted)", fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
      {isAdmin ? "Sense dades per aquest període" : "Cap visita registrada encara"}
    </p>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/analytics?days=${days}`, { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDevices = data ? data.devices.mobile + data.devices.desktop : 0;
  const mobilePct = totalDevices > 0 ? Math.round((data!.devices.mobile / totalDevices) * 100) : 0;
  const isAdmin = data?.isAdmin ?? false;

  return (
    <div>
      <style>{`
        .analytics-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .analytics-section-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .analytics-filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .analytics-period-btn { padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(26,107,58,0.2); background: white; color: var(--muted); font-family: var(--font-sans); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .analytics-period-btn:hover { border-color: var(--verd); color: var(--verd-fosc); }
        .analytics-period-btn.active { background: var(--verd-fosc); color: white; border-color: var(--verd-fosc); }
        .analytics-refresh-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 99px; border: 1px solid rgba(26,107,58,0.2); background: white; color: var(--muted); font-family: var(--font-sans); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-left: auto; }
        .analytics-refresh-btn:hover { color: var(--verd-fosc); border-color: var(--verd); }
        .analytics-activity-row { display: grid; grid-template-columns: 1fr 64px 72px 64px; gap: 8px; padding: 12px 0; border-bottom: 1px solid rgba(26,107,58,0.05); align-items: center; font-size: 13px; }
        .analytics-activity-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .analytics-kpi-grid { grid-template-columns: repeat(4, 1fr); }
          .analytics-section-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .analytics-section-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "36px", color: "var(--verd-fosc)", margin: 0 }}>Analítica</h1>
          <p style={{ fontSize: "15px", color: "var(--muted)", marginTop: "6px", margin: 0 }}>
            {isAdmin ? "Estadístiques globals de GironaXics" : "Estadístiques de les teves activitats"}
            {lastUpdated && <span style={{ marginLeft: "8px", fontSize: "12px" }}>· Actualitzat {lastUpdated.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
      </div>

      {/* ── Filtre de període ── */}
      <div className="analytics-filter-row" style={{ marginBottom: "24px" }}>
        {PERIOD_OPTIONS.map((opt) => (
          <button key={opt.value} className={`analytics-period-btn ${days === opt.value ? "active" : ""}`} onClick={() => setDays(opt.value)}>
            {opt.label}
          </button>
        ))}
        <button className="analytics-refresh-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Actualitzar
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ backgroundColor: "#fde8e8", color: "#c0392b", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", fontSize: "14px" }}>
          Error carregant les estadístiques. Comprova la connexió a Airtable.
        </div>
      )}

      {/* ── Loading ── */}
      {loading && !data && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
          <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "16px" }} />
          <p>Carregant estadístiques...</p>
        </div>
      )}

      {/* ── Dades ── */}
      {data && (
        <>
          {/* KPI Cards */}
          <div className="analytics-kpi-grid">
            <KpiCard icon={TrendingUp} label="Visites a activitats" value={data.totals.activityViews} color="#1a6b3a" />
            <KpiCard icon={Phone} label="Clics telèfon" value={data.totals.contactPhone} color="#2563eb" />
            <KpiCard icon={Mail} label="Correus enviats" value={data.totals.contactEmail} color="#7c3aed" />
            {isAdmin
              ? <KpiCard icon={MousePointerClick} label="Clics sponsors" value={data.totals.sponsorClicks} color="#d97706" sub={data.totals.casalsBannerClicks > 0 ? `+ ${data.totals.casalsBannerClicks} al banner casals` : undefined} />
              : <KpiCard icon={MousePointerClick} label="Total contactes" value={data.totals.totalContacts} color="#16a34a" />
            }
          </div>

          {/* Seccions */}
          <div className="analytics-section-grid">

            {/* Les meves / totes les activitats */}
            <SectionCard title={isAdmin ? "Activitats més vistes" : "Les meves activitats"} icon={Star}>
              {data.topActivitats.length === 0 ? <EmptyState isAdmin={isAdmin} /> : (
                <>
                  <div className="analytics-activity-row" style={{ fontWeight: 700, color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 0 }}>
                    <span>Activitat</span>
                    <span style={{ textAlign: "right" }}>Visites</span>
                    <span style={{ textAlign: "right" }}>Contactes</span>
                    <span style={{ textAlign: "right" }}>Conv.</span>
                  </div>
                  {data.topActivitats.map((a, i) => (
                    <div key={i} className="analytics-activity-row">
                      <span style={{ fontWeight: 600, color: "var(--fosc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.label}>{a.label}</span>
                      <span style={{ textAlign: "right", fontWeight: 700, color: "var(--verd-fosc)" }}>{a.views}</span>
                      <span style={{ textAlign: "right", color: "#2563eb", fontWeight: 600 }}>{a.contacts}</span>
                      <span style={{ textAlign: "right", fontWeight: 700, color: a.ratio >= 20 ? "#16a34a" : a.ratio >= 5 ? "#d97706" : "var(--muted)" }}>{a.ratio}%</span>
                    </div>
                  ))}
                </>
              )}
            </SectionCard>

            {/* Centres — només admin */}
            {isAdmin && (
              <SectionCard title="Estadístiques per Centre" icon={Building2}>
                {!data.topCentres || data.topCentres.length === 0 ? <EmptyState isAdmin={isAdmin} /> : (
                  <>
                    <div className="analytics-activity-row" style={{ fontWeight: 700, color: "var(--muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 0 }}>
                      <span>Centre</span>
                      <span style={{ textAlign: "right" }}>Visites</span>
                      <span style={{ textAlign: "right" }}>Contactes</span>
                      <span style={{ textAlign: "right" }}>Conv.</span>
                    </div>
                    {data.topCentres.map((c, i) => (
                      <div key={i} className="analytics-activity-row">
                        <span style={{ fontWeight: 600, color: "var(--fosc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.label}>{c.label}</span>
                        <span style={{ textAlign: "right", fontWeight: 700, color: "var(--verd-fosc)" }}>{c.views}</span>
                        <span style={{ textAlign: "right", color: "#2563eb", fontWeight: 600 }}>{c.contacts}</span>
                        <span style={{ textAlign: "right", fontWeight: 700, color: c.ratio >= 20 ? "#16a34a" : c.ratio >= 5 ? "#d97706" : "var(--muted)" }}>{c.ratio}%</span>
                      </div>
                    ))}
                  </>
                )}
              </SectionCard>
            )}

            {/* Categories — només admin */}
            {isAdmin && (
              <SectionCard title="Categories més cercades" icon={Filter}>
                {data.topCategories.length === 0 ? <EmptyState isAdmin={isAdmin} /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {data.topCategories.map((c, i) => <HorizontalBar key={i} label={c.label} count={c.count} max={data.topCategories[0]?.count ?? 1} color="#1a6b3a" />)}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Barris — només admin */}
            {isAdmin && (
              <SectionCard title="Barris més filtrats" icon={MapPin}>
                {data.topBarris.length === 0 ? <EmptyState isAdmin={isAdmin} /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {data.topBarris.map((b, i) => <HorizontalBar key={i} label={b.label} count={b.count} max={data.topBarris[0]?.count ?? 1} color="#2563eb" />)}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Edats — només admin */}
            {isAdmin && (
              <SectionCard title="Franges d'edat més cercades" icon={Users}>
                {data.topEdats.length === 0 ? <EmptyState isAdmin={isAdmin} /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {data.topEdats.map((e, i) => <HorizontalBar key={i} label={e.label} count={e.count} max={data.topEdats[0]?.count ?? 1} color="#7c3aed" />)}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Sponsors — només admin */}
            {isAdmin && (
              <SectionCard title="Clics als sponsors" icon={MousePointerClick}>
                {data.topSponsors.length === 0
                  ? <EmptyState isAdmin={isAdmin} />
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {data.topSponsors.map((s, i) => <HorizontalBar key={i} label={s.label} count={s.count} max={data.topSponsors[0]?.count ?? 1} color="#d97706" />)}
                      <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "1px solid rgba(26,107,58,0.06)", fontSize: "13px", color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
                        <span>Banner Casals</span>
                        <span style={{ fontWeight: 700, color: "var(--verd-fosc)" }}>{data.totals.casalsBannerClicks} clics</span>
                      </div>
                    </div>
                  )
                }
              </SectionCard>
            )}

            {/* Dispositius — només admin */}
            {isAdmin && (
              <SectionCard title="Dispositius" icon={BarChart2}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    { label: "📱 Mòbil", count: data.devices.mobile, pct: mobilePct, color: "#1a6b3a" },
                    { label: "🖥️ Escriptori", count: data.devices.desktop, pct: 100 - mobilePct, color: "#2563eb" },
                  ].map(({ label, count, pct, color }) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600 }}>{label}</span>
                        <span style={{ fontWeight: 700, color: "var(--verd-fosc)" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: "10px", backgroundColor: "rgba(26,107,58,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "99px", transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "12px 16px", backgroundColor: "rgba(26,107,58,0.03)", borderRadius: "8px", fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>
                    Total interaccions trackejades: <strong>{totalDevices}</strong>
                  </div>
                </div>
              </SectionCard>
            )}

          </div>

          {/* Peu */}
          <div style={{ marginTop: "32px", padding: "16px 20px", backgroundColor: "rgba(26,107,58,0.03)", borderRadius: "12px", border: "1px solid rgba(26,107,58,0.08)", fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
            📊 Les dades es guarden a Airtable · No es recull cap dada personal · Els events es registren de manera anònima i agregada.
          </div>
        </>
      )}
    </div>
  );
}
