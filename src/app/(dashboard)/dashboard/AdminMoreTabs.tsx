/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { Tag, Calendar, Award, Users, MapPin, BarChart2, Plus, Trash2 } from "lucide-react";
import { supabase, createDbCategory, createDbSubcategory, deleteDbCategory, deleteDbSubcategory } from "@/lib/db";

export default function AdminMoreTabs({ tab }: { tab: "categories" | "casals" | "sponsors" | "usuaris" | "poblacions" | "analytics" }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Estats per creació de categories i subcategories
  const [newCatName, setNewCatName] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [selectedParentCat, setSelectedParentCat] = useState("General");

  // Estats de formulari per casals banner
  const [casalsForm, setCasalsForm] = useState({
    id: "",
    nom: "Casals d'estiu",
    titol: "Casals d'Estiu a Girona",
    subtitol: "Tots els casals d'estiu per a infants i adolescents",
    data_limit: "",
    actiu: true
  });

  useEffect(() => {
    loadTabData();
  }, [tab]);

  async function loadTabData() {
    setLoading(true);
    setMsg("");
    if (!supabase) {
      setLoading(false);
      return;
    }

    if (tab === "categories") {
      const { data: catData } = await supabase.from("categories").select("*").order("ordre");
      const { data: subData } = await supabase.from("subcategories").select("*").order("nom");
      setData(catData || []);
      setSubcategories(subData || []);
    } else if (tab === "casals") {
      const { data: casData } = await supabase.from("casals_banners").select("*").limit(1);
      if (casData && casData.length > 0) {
        setCasalsForm({
          id: casData[0].id,
          nom: casData[0].nom || "Casals d'estiu",
          titol: casData[0].titol || "",
          subtitol: casData[0].subtitol || "",
          data_limit: casData[0].data_limit || "",
          actiu: !!casData[0].actiu
        });
      }
    } else if (tab === "sponsors") {
      const { data: spData } = await supabase.from("sponsors").select("*").order("nom");
      setData(spData || []);
    } else if (tab === "usuaris") {
      const { data: uData } = await supabase.from("usuaris_centres").select("*").order("email");
      const { data: cData } = await supabase.from("centres").select("id, nom");
      const cMap = new Map((cData || []).map(c => [c.id, c.nom]));
      const formatted = (uData || []).map(u => ({
        ...u,
        nomCentre: cMap.get(u.centre_id) || "Sense centre assignat"
      }));
      setData(formatted);
    } else if (tab === "poblacions") {
      const { data: pData } = await supabase.from("poblacions").select("*").order("nom");
      setData(pData || []);
    } else if (tab === "analytics") {
      const { data: aData } = await supabase.from("analytics").select("*").order("created_at", { ascending: false }).limit(200);
      setData(aData || []);
    }

    setLoading(false);
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    const newId = await createDbCategory(newCatName.trim());
    if (newId) {
      setNewCatName("");
      setMsg("✅ Categoria principal creada!");
      loadTabData();
    } else {
      setMsg("❌ Error creant la categoria.");
    }
    setSaving(false);
  }

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubcatName.trim()) return;
    setSaving(true);
    const newId = await createDbSubcategory(newSubcatName.trim(), selectedParentCat);
    if (newId) {
      setNewSubcatName("");
      setMsg("✅ Subcategoria creada!");
      loadTabData();
    } else {
      setMsg("❌ Error creant la subcategoria.");
    }
    setSaving(false);
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("Segur que vols eliminar aquesta categoria?")) return;
    await deleteDbCategory(id);
    loadTabData();
  }

  async function handleDeleteSubcat(id: string) {
    if (!confirm("Segur que vols eliminar aquesta subcategoria?")) return;
    await deleteDbSubcategory(id);
    loadTabData();
  }

  async function handleSaveCasals(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    if (!supabase) return;

    const { error } = await supabase.from("casals_banners").upsert({
      id: casalsForm.id || `casal_${Date.now()}`,
      nom: casalsForm.nom,
      titol: casalsForm.titol,
      subtitol: casalsForm.subtitol,
      data_limit: casalsForm.data_limit,
      actiu: casalsForm.actiu,
      ciutat: "girona"
    });

    if (error) {
      setMsg("❌ Error desant la configuració de Casals.");
    } else {
      setMsg("✅ Configuració del banner de Casals actualitzada amb èxit!");
    }
    setSaving(false);
  }

  async function handleToggleSponsorActiu(id: string, currentStatus: boolean) {
    if (!supabase) return;
    await supabase.from("sponsors").update({ actiu: !currentStatus }).eq("id", id);
    loadTabData();
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
        ⏳ Carregant dades de Supabase...
      </div>
    );
  }

  return (
    <div style={{ background: "white", padding: "28px", borderRadius: "16px", border: "1px solid var(--crema-fosca)" }}>
      {/* 1. SECCIÓ CATEGORIES */}
      {tab === "categories" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            🏷️ Gestió de Categories i Subcategories Principals
          </h3>

          {msg && <div style={{ padding: "10px 14px", borderRadius: "8px", background: msg.includes("✅") ? "#e6f4ea" : "#fce8e6", color: msg.includes("✅") ? "#137333" : "#c5221f", marginBottom: "16px" }}>{msg}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
            {/* CATEGORIES PRINCIPALS */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Categories Principals ({data.length})</h4>
              
              <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Nova categoria..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--verd)", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={16} /> Crear
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.map(c => (
                  <div key={c.id} style={{ padding: "12px 16px", background: "var(--crema)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{c.nom}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "8px" }}>({c.slug})</span>
                    </div>
                    <button onClick={() => handleDeleteCat(c.id)} style={{ border: "none", background: "none", color: "#c5221f", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBCATEGORIES */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Subcategories ({subcategories.length})</h4>

              <form onSubmit={handleCreateSubcategory} style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Nova subcategoria..."
                  value={newSubcatName}
                  onChange={e => setNewSubcatName(e.target.value)}
                  style={{ flex: 1, minWidth: "140px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <select
                  value={selectedParentCat}
                  onChange={e => setSelectedParentCat(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="General">General</option>
                  {data.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--verd)", color: "white", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={16} /> Crear
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                {subcategories.map(s => (
                  <div key={s.id} style={{ padding: "10px 14px", border: "1px solid #eee", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span>{s.nom}</span>
                      <span style={{ fontSize: "12px", color: "var(--verd)", fontWeight: 600, marginLeft: "8px" }}>[{s.categoria}]</span>
                    </div>
                    <button onClick={() => handleDeleteSubcat(s.id)} style={{ border: "none", background: "none", color: "#c5221f", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECCIÓ CASALS */}
      {tab === "casals" && (
        <div style={{ maxWidth: "600px" }}>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            ☀️ Configuració del Banner de Casals d'Estiu
          </h3>
          
          {msg && <div style={{ padding: "12px", borderRadius: "8px", background: msg.includes("✅") ? "#e6f4ea" : "#fce8e6", color: msg.includes("✅") ? "#137333" : "#c5221f", marginBottom: "16px" }}>{msg}</div>}

          <form onSubmit={handleSaveCasals} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Nom de la Campanya</label>
              <input
                type="text"
                value={casalsForm.nom}
                onChange={e => setCasalsForm({ ...casalsForm, nom: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Títol del Banner</label>
              <input
                type="text"
                value={casalsForm.titol}
                onChange={e => setCasalsForm({ ...casalsForm, titol: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Subtítol / Descripció Curta</label>
              <textarea
                value={casalsForm.subtitol}
                onChange={e => setCasalsForm({ ...casalsForm, subtitol: e.target.value })}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Data Límit d'Inscripció (YYYY-MM-DD)</label>
              <input
                type="date"
                value={casalsForm.data_limit}
                onChange={e => setCasalsForm({ ...casalsForm, data_limit: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>Si la data és anterior a avui, el banner de casals s'amaga automàticament.</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="casal-actiu"
                checked={casalsForm.actiu}
                onChange={e => setCasalsForm({ ...casalsForm, actiu: e.target.checked })}
              />
              <label htmlFor="casal-actiu" style={{ fontWeight: 600, cursor: "pointer" }}>Activar Secció de Casals d'Estiu a la Web</label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 24px",
                backgroundColor: "var(--verd)",
                color: "white",
                border: "none",
                borderRadius: "100px",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "12px"
              }}
            >
              {saving ? "Desant..." : "Desar Configuració de Casals"}
            </button>
          </form>
        </div>
      )}

      {/* 3. SECCIÓ SPONSORS */}
      {tab === "sponsors" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            🏆 Patrocinadors i Sponsors ({data.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {data.map(s => (
              <div key={s.id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "12px", background: "white" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>{s.nom}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px" }}>Categoria: {s.categoria_slug}</div>
                {s.imatge_url && <img src={s.imatge_url} alt={s.nom} style={{ height: "40px", objectFit: "contain", marginBottom: "12px" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: s.actiu ? "#137333" : "#c5221f", fontWeight: 700 }}>{s.actiu ? "● Actiu" : "○ Inactiu"}</span>
                  <button
                    onClick={() => handleToggleSponsorActiu(s.id, s.actiu)}
                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", background: "#f9f9f9", cursor: "pointer", fontSize: "12px" }}
                  >
                    {s.actiu ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SECCIÓ USUARIS CENTRES */}
      {tab === "usuaris" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            👤 Comptes d'Accés dels Centres ({data.length})
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", paddingBottom: "8px" }}>
                  <th style={{ padding: "10px" }}>Email d'Accés</th>
                  <th style={{ padding: "10px" }}>Centre Assignat</th>
                  <th style={{ padding: "10px" }}>ID Usuari</th>
                </tr>
              </thead>
              <tbody>
                {data.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 600 }}>{u.email}</td>
                    <td style={{ padding: "12px 10px", color: "var(--verd-fosc)" }}>{u.nomCentre}</td>
                    <td style={{ padding: "12px 10px", fontSize: "12px", color: "var(--muted)" }}>{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SECCIÓ POBLACIONS */}
      {tab === "poblacions" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            📍 Poblacions i Barris Registrats ({data.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", maxHeight: "500px", overflowY: "auto" }}>
            {data.map((p, idx) => (
              <div key={idx} style={{ padding: "10px 14px", background: "var(--crema)", borderRadius: "8px" }}>
                <div style={{ fontWeight: 600 }}>{p.nom}</div>
                {p.comarca && <div style={{ fontSize: "12px", color: "var(--muted)" }}>{p.comarca}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SECCIÓ ANALYTICS */}
      {tab === "analytics" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            📊 Mètrics i Estadístiques de Cerques ({data.length} esdeveniments recents)
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  <th style={{ padding: "10px" }}>Data / Hora</th>
                  <th style={{ padding: "10px" }}>Tipus d'Esdeveniment</th>
                  <th style={{ padding: "10px" }}>Filtre / Cerca</th>
                  <th style={{ padding: "10px" }}>Dispositiu</th>
                </tr>
              </thead>
              <tbody>
                {data.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px", fontSize: "12px", color: "var(--muted)" }}>{new Date(a.created_at).toLocaleString('ca-ES')}</td>
                    <td style={{ padding: "10px", fontWeight: 600, color: "var(--verd)" }}>{a.event_type}</td>
                    <td style={{ padding: "10px" }}>{a.event_label || a.category_name || '-'}</td>
                    <td style={{ padding: "10px" }}>{a.device || 'desktop'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
