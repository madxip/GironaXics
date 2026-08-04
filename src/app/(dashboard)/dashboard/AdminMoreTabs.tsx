/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { Tag, Calendar, Award, Users, MapPin, BarChart2, Plus, Trash2, CheckCircle2, XCircle, Edit, Sun } from "lucide-react";
import { 
  supabase, 
  createDbCategory, 
  createDbSubcategory, 
  deleteDbCategory, 
  deleteDbSubcategory,
  createDbSponsor,
  updateDbSponsor,
  deleteDbSponsor,
  createDbCasalsBanner,
  updateDbCasalsBanner,
  deleteDbCasalsBanner,
  getDbCategories,
  getDbSubcategories,
  getDbCasalsBanners,
  getDbSponsors,
  getDbUsuaris,
  getDbPoblacions,
  getDbAnalytics
} from "@/lib/db";
import ImageCropperModal from "@/components/ImageCropperModal";
import { CRMCentre } from "@/lib/crm";

interface AdminMoreTabsProps {
  tab: "categories" | "casals" | "sponsors" | "usuaris" | "poblacions" | "analytics";
  initialCategories?: any[];
  initialSubcategories?: any[];
  initialCasals?: any[];
  initialSponsors?: any[];
  initialUsuaris?: any[];
  initialPoblacions?: any[];
  initialAnalytics?: any[];
  centres?: CRMCentre[];
}

export default function AdminMoreTabs({
  tab,
  initialCategories = [],
  initialSubcategories = [],
  initialCasals = [],
  initialSponsors = [],
  initialUsuaris = [],
  initialPoblacions = [],
  initialAnalytics = [],
  centres = []
}: AdminMoreTabsProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [subcategories, setSubcategories] = useState<any[]>(initialSubcategories);
  const [casals, setCasals] = useState<any[]>(initialCasals);
  const [sponsors, setSponsors] = useState<any[]>(initialSponsors);
  const [usuaris, setUsuaris] = useState<any[]>(initialUsuaris);
  const [poblacions, setPoblacions] = useState<any[]>(initialPoblacions);
  const [analytics, setAnalytics] = useState<any[]>(initialAnalytics);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Estats per creació de categories i subcategories
  const [newCatName, setNewCatName] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [selectedParentCat, setSelectedParentCat] = useState("General");

  // Estats per formulari de Casals
  const [newCasal, setNewCasal] = useState({
    nom: "Casals d'Estiu",
    titol: "Casals d'Estiu a Girona",
    subtitol: "Tots els casals d'estiu per a infants i adolescents",
    dataLimit: "",
    dataInici: "",
    dataFi: ""
  });

  // Estats per formulari de Sponsors
  const [newSponsor, setNewSponsor] = useState({
    nom: "",
    categoriaSlug: "patrocinador",
    imatgeUrl: "",
    imatgeFonsUrl: "",
    enllac: "",
    actiu: true,
    descripcio: "",
    titol: ""
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tab-data?tab=${tab}`);
      if (res.ok) {
        const data = await res.json();
        if (tab === "categories") {
          if (Array.isArray(data.categories)) setCategories(data.categories);
          if (Array.isArray(data.subcategories)) setSubcategories(data.subcategories);
        } else if (tab === "casals") {
          if (Array.isArray(data.casals)) setCasals(data.casals);
        } else if (tab === "sponsors") {
          if (Array.isArray(data.sponsors)) setSponsors(data.sponsors);
        } else if (tab === "usuaris") {
          if (Array.isArray(data.usuaris)) setUsuaris(data.usuaris);
        } else if (tab === "poblacions") {
          if (Array.isArray(data.poblacions)) setPoblacions(data.poblacions);
        } else if (tab === "analytics") {
          if (Array.isArray(data.analytics)) setAnalytics(data.analytics);
        }
      }
    } catch (err) {
      console.error("Error carregant dades:", err);
    }
    setLoading(false);
  }

  // 1. HANDLERS CATEGORIES & SUBCATEGORIES
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/tab-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-category", data: { nom: newCatName.trim() } })
    });
    if (res.ok) {
      setNewCatName("");
      setMsg("✅ Categoria principal creada!");
      loadData();
    } else {
      setMsg("❌ Error creant la categoria.");
    }
    setSaving(false);
  }

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubcatName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/tab-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-subcategory", data: { nom: newSubcatName.trim(), categoria: selectedParentCat } })
    });
    if (res.ok) {
      setNewSubcatName("");
      setMsg("✅ Subcategoria creada!");
      loadData();
    } else {
      setMsg("❌ Error creant la subcategoria.");
    }
    setSaving(false);
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("Segur que vols eliminar aquesta categoria?")) return;
    const res = await fetch(`/api/admin/tab-data?item=category&id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("✅ Categoria eliminada!");
      loadData();
    } else {
      setMsg("❌ Error eliminant la categoria.");
    }
  }

  async function handleDeleteSubcat(id: string) {
    if (!confirm("Segur que vols eliminar aquesta subcategoria?")) return;
    const res = await fetch(`/api/admin/tab-data?item=subcategory&id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("✅ Subcategoria eliminada!");
      loadData();
    } else {
      setMsg("❌ Error eliminant la subcategoria.");
    }
  }

  // 2. HANDLERS CASALS
  async function handleCreateCasal(e: React.FormEvent) {
    e.preventDefault();
    if (!newCasal.nom.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/tab-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-casal", data: newCasal })
    });
    if (res.ok) {
      setMsg("✅ Campanya de Casals afegida!");
      setNewCasal({ nom: "", titol: "", subtitol: "", dataLimit: "", dataInici: "", dataFi: "" });
      loadData();
    } else {
      setMsg("❌ Error afegint la campanya de Casals.");
    }
    setSaving(false);
  }

  async function handleToggleCasalActiu(id: string, currentStatus: boolean) {
    const res = await fetch("/api/admin/tab-data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-casal", id, data: { actiu: !currentStatus } })
    });
    if (res.ok) loadData();
  }

  async function handleDeleteCasal(id: string) {
    if (!confirm("Segur que vols eliminar aquesta campanya de Casals?")) return;
    const res = await fetch(`/api/admin/tab-data?item=casal&id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("✅ Campanya de Casals eliminada!");
      loadData();
    } else {
      setMsg("❌ Error eliminant la campanya de Casals.");
    }
  }

  // 3. HANDLERS SPONSORS
  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsor.nom.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/tab-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-sponsor", data: newSponsor })
    });
    if (res.ok) {
      setMsg("✅ Sponsor afegit amb èxit!");
      setNewSponsor({ nom: "", categoriaSlug: "general", imatgeUrl: "", imatgeFonsUrl: "", enllac: "", actiu: true, descripcio: "", titol: "" });
      loadData();
    } else {
      setMsg("❌ Error creant el sponsor.");
    }
    setSaving(false);
  }

  async function handleToggleSponsorActiu(id: string, currentStatus: boolean) {
    const res = await fetch("/api/admin/tab-data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-sponsor", id, data: { actiu: !currentStatus } })
    });
    if (res.ok) loadData();
  }

  async function handleDeleteSponsor(id: string) {
    if (!confirm("Segur que vols eliminar aquest sponsor?")) return;
    const res = await fetch(`/api/admin/tab-data?item=sponsor&id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("✅ Sponsor eliminat!");
      loadData();
    } else {
      setMsg("❌ Error eliminant el sponsor.");
    }
  }

  // 4. HANDLERS USUARIS CENTRES
  async function handleAssignUserCentre(userId: string, centreId: string) {
    if (!supabase || !userId) return;
    await supabase.from("usuaris_centres").update({ centre_id: centreId }).eq("id", userId);
    setMsg("✅ Centre assignat a l'usuari amb èxit!");
    loadData();
  }

  return (
    <div style={{ background: "white", padding: "28px", borderRadius: "16px", border: "1px solid var(--crema-fosca)" }}>
      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: msg.includes("✅") ? "#e6f4ea" : "#fce8e6", color: msg.includes("✅") ? "#137333" : "#c5221f", marginBottom: "20px", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* 1. SECCIÓ CATEGORIES */}
      {tab === "categories" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            🏷️ Gestió de Categories i Subcategories Principals
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
            {/* CATEGORIES PRINCIPALS */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Categories Principals ({categories.length})</h4>
              
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
                {categories.map(c => (
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
                  {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
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
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            ☀️ Gestió de Campanyes de CASALS (Estiu, Nadal, Setmana Santa)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
            {/* FORMULARI CREAR NOU CASAL */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Nova Campanya de Casals</h4>
              <form onSubmit={handleCreateCasal} style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--crema)", padding: "16px", borderRadius: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Nom de la Campanya (ex: Casals d'Estiu, Casals de Nadal)</label>
                  <input
                    type="text"
                    required
                    value={newCasal.nom}
                    onChange={e => setNewCasal({ ...newCasal, nom: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Títol del Banner</label>
                  <input
                    type="text"
                    required
                    value={newCasal.titol}
                    onChange={e => setNewCasal({ ...newCasal, titol: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Subtítol / Descripció</label>
                  <input
                    type="text"
                    value={newCasal.subtitol}
                    onChange={e => setNewCasal({ ...newCasal, subtitol: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Data Límit d'Inscripció (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={newCasal.dataLimit}
                    onChange={e => setNewCasal({ ...newCasal, dataLimit: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Data Inici Visibilitat (Publicar)</label>
                    <input
                      type="date"
                      value={newCasal.dataInici}
                      onChange={e => setNewCasal({ ...newCasal, dataInici: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Data Fi Visibilitat (Ocultar)</label>
                    <input
                      type="date"
                      value={newCasal.dataFi}
                      onChange={e => setNewCasal({ ...newCasal, dataFi: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 16px", borderRadius: "100px", border: "none", background: "var(--verd)", color: "white", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}
                >
                  <Plus size={16} /> Crear Campanya de Casals
                </button>
              </form>
            </div>

            {/* LLISTAT DE CASALS */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Campanyes Registrades ({casals.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {casals.map(c => (
                  <div key={c.id} style={{ border: "1px solid #eee", padding: "14px 16px", borderRadius: "12px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px" }}>{c.nom}</div>
                      <div style={{ fontSize: "13px", color: "var(--muted)" }}>{c.titol}</div>
                      {c.dataLimit && <div style={{ fontSize: "12px", color: "#d95738" }}>Límit inscripció: {c.dataLimit}</div>}
                      {(c.dataInici || c.dataFi) && (
                        <div style={{ fontSize: "12px", color: "var(--verd)", marginTop: "2px", fontWeight: 600 }}>
                          📅 Mostra des de {c.dataInici || 'Inici'} fins a {c.dataFi || 'Sempre'}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleToggleCasalActiu(c.id, c.actiu)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: c.actiu ? "#e6f4ea" : "#fce8e6", color: c.actiu ? "#137333" : "#c5221f", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}
                      >
                        {c.actiu ? "● Actiu" : "○ Inactiu"}
                      </button>
                      <button onClick={() => handleDeleteCasal(c.id)} style={{ border: "none", background: "none", color: "#c5221f", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECCIÓ SPONSORS */}
      {tab === "sponsors" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            🏆 Patrocinadors i Sponsors ({sponsors.length})
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px" }}>
            {/* FORMULARI CREAR SPONSOR */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: "12px", color: "var(--verd)" }}>Afegir Nou Sponsor</h4>
              <form onSubmit={handleCreateSponsor} style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--crema)", padding: "16px", borderRadius: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Nom del Patrocinador</label>
                  <input
                    type="text"
                    required
                    value={newSponsor.nom}
                    onChange={e => setNewSponsor({ ...newSponsor, nom: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                    Logo del Patrocinador
                  </label>
                  
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingLogo(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          const json = await res.json();
                          if (json.url) {
                            setNewSponsor(prev => ({ ...prev, imatgeUrl: json.url }));
                            setMsg("✅ Logo de sponsor carregat correctament a Supabase!");
                          } else {
                            setMsg("❌ Error pujant la imatge.");
                          }
                        } catch (err) {
                          setMsg("❌ Error de connexió.");
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "white", fontSize: "13px" }}
                    />
                    {uploadingLogo && <div style={{ fontSize: "12px", color: "var(--verd)", fontWeight: 600, marginTop: "4px" }}>⏳ Pujant imatge a Supabase...</div>}
                  </div>

                  <input
                    type="text"
                    placeholder="o enganxa una URL https://..."
                    value={newSponsor.imatgeUrl}
                    onChange={e => setNewSponsor({ ...newSponsor, imatgeUrl: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />

                  {newSponsor.imatgeUrl && (
                    <div style={{ marginTop: "8px", padding: "8px", background: "white", borderRadius: "8px", border: "1px solid #eee", display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={newSponsor.imatgeUrl} alt="Preview" style={{ height: "40px", objectFit: "contain", borderRadius: "4px" }} />
                      <span style={{ fontSize: "11px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{newSponsor.imatgeUrl}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                    Imatge de Fons / Banner (Pujar i Retallar)
                  </label>
                  
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setCropperImageSrc(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "white", fontSize: "13px" }}
                    />
                    {uploadingBg && <div style={{ fontSize: "12px", color: "var(--verd)", fontWeight: 600, marginTop: "4px" }}>⏳ Pujant fons retallat a Supabase...</div>}
                  </div>

                  <input
                    type="text"
                    placeholder="o URL de fons https://..."
                    value={newSponsor.imatgeFonsUrl}
                    onChange={e => setNewSponsor({ ...newSponsor, imatgeFonsUrl: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />

                  {/* PREVISUALITZACIÓ DUAL DESKTOP I MÒBIL */}
                  {(newSponsor.imatgeUrl || newSponsor.imatgeFonsUrl || newSponsor.nom) && (
                    <div style={{ marginTop: "12px", padding: "14px", background: "white", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--verd)", marginBottom: "10px" }}>
                        👁️ Previsualització en temps real (Com es veurà al web):
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        {/* MODEL DESKTOP (3:4 Vertical) */}
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#666", marginBottom: "6px", textTransform: "uppercase" }}>
                            🖥️ Desktop (Vertical 3:4)
                          </div>
                          <div style={{
                            width: "100%",
                            aspectRatio: "3/4",
                            borderRadius: "14px",
                            position: "relative",
                            overflow: "hidden",
                            backgroundImage: newSponsor.imatgeFonsUrl ? `url(${newSponsor.imatgeFonsUrl})` : "none",
                            backgroundColor: newSponsor.imatgeFonsUrl ? "transparent" : "#1b3d2f",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "12px",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            color: "white"
                          }}>
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(12, 34, 20, 0.1) 0%, rgba(12, 34, 20, 0.4) 40%, rgba(9, 26, 15, 0.95) 100%)", zIndex: 1 }} />
                            
                            <div style={{ position: "relative", zIndex: 2 }}>
                              <span style={{ backgroundColor: "#ffb703", color: "#1b3d2f", fontSize: "8px", fontWeight: 800, padding: "3px 6px", borderRadius: "20px", textTransform: "uppercase" }}>
                                Patrocinat
                              </span>
                            </div>

                            <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "6px" }}>
                              {newSponsor.imatgeUrl && (
                                <div style={{ backgroundColor: "rgba(255,255,255,0.92)", padding: "4px 6px", borderRadius: "6px", width: "fit-content", display: "flex", alignItems: "center" }}>
                                  <img src={newSponsor.imatgeUrl} alt="Logo" style={{ maxHeight: "24px", maxWidth: "70px", objectFit: "contain" }} />
                                </div>
                              )}
                              <div style={{ fontWeight: 800, fontSize: "13px", lineHeight: "1.2" }}>
                                {newSponsor.nom || "Nom del Patrocinador"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* MODEL MÒBIL (Horitzontal) */}
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 800, color: "#666", marginBottom: "6px", textTransform: "uppercase" }}>
                            📱 Mòbil (Horitzontal)
                          </div>
                          <div style={{
                            width: "100%",
                            height: "140px",
                            borderRadius: "14px",
                            position: "relative",
                            overflow: "hidden",
                            backgroundImage: newSponsor.imatgeFonsUrl ? `url(${newSponsor.imatgeFonsUrl})` : "none",
                            backgroundColor: newSponsor.imatgeFonsUrl ? "transparent" : "#1b3d2f",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "10px",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                            color: "white"
                          }}>
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(12, 34, 20, 0.2) 0%, rgba(9, 26, 15, 0.95) 100%)", zIndex: 1 }} />

                            <div style={{ position: "relative", zIndex: 2 }}>
                              <span style={{ backgroundColor: "#ffb703", color: "#1b3d2f", fontSize: "8px", fontWeight: 800, padding: "2px 5px", borderRadius: "20px", textTransform: "uppercase" }}>
                                Patrocinat
                              </span>
                            </div>

                            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "6px" }}>
                              <div style={{ fontWeight: 800, fontSize: "12px", lineHeight: "1.2" }}>
                                {newSponsor.nom || "Nom del Patrocinador"}
                              </div>
                              {newSponsor.imatgeUrl && (
                                <div style={{ backgroundColor: "rgba(255,255,255,0.92)", padding: "3px 5px", borderRadius: "5px", flexShrink: 0 }}>
                                  <img src={newSponsor.imatgeUrl} alt="Logo" style={{ maxHeight: "20px", maxWidth: "50px", objectFit: "contain" }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Enllaç Web (Link)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newSponsor.enllac}
                    onChange={e => setNewSponsor({ ...newSponsor, enllac: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Categoria / Tipus</label>
                  <select
                    value={newSponsor.categoriaSlug}
                    onChange={e => setNewSponsor({ ...newSponsor, categoriaSlug: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", background: "white", fontSize: "14px" }}
                  >
                    <option value="general">⭐ TOTES (Sense filtre / General)</option>
                    {categories.map(c => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.nom} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 16px", borderRadius: "100px", border: "none", background: "var(--verd)", color: "white", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}
                >
                  <Plus size={16} /> Crear Sponsor
                </button>
              </form>
            </div>

            {/* LLISTAT DE SPONSORS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", alignContent: "start" }}>
              {sponsors.map(s => (
                <div key={s.id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "12px", background: "white" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>{s.nom}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{s.categoriaSlug}</div>
                  {s.imatgeUrl && <img src={s.imatgeUrl} alt={s.nom} style={{ height: "40px", objectFit: "contain", marginBottom: "8px" }} />}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                    <button
                      onClick={() => handleToggleSponsorActiu(s.id, s.actiu)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: s.actiu ? "#e6f4ea" : "#fce8e6", color: s.actiu ? "#137333" : "#c5221f", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}
                    >
                      {s.actiu ? "● Actiu" : "○ Inactiu"}
                    </button>
                    <button onClick={() => handleDeleteSponsor(s.id)} style={{ border: "none", background: "none", color: "#c5221f", cursor: "pointer" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECCIÓ USUARIS CENTRES */}
      {tab === "usuaris" && (
        <div>
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", marginBottom: "16px" }}>
            👤 Comptes d'Accés i Acceptació de Centres ({usuaris.length})
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", paddingBottom: "8px" }}>
                  <th style={{ padding: "10px" }}>Email d'Accés</th>
                  <th style={{ padding: "10px" }}>Centre Assignat</th>
                  <th style={{ padding: "10px" }}>Acció d'Assignació / Aprovació</th>
                </tr>
              </thead>
              <tbody>
                {usuaris.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 600 }}>{u.email}</td>
                    <td style={{ padding: "12px 10px", color: "var(--verd-fosc)", fontWeight: 600 }}>{u.nomCentre}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <select
                        value={u.centreId || ""}
                        onChange={e => handleAssignUserCentre(u.id, e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "13px" }}
                      >
                        <option value="">-- Assignar Centre --</option>
                        {centres.map(c => (
                          <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                      </select>
                    </td>
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
            📍 Poblacions i Barris Registrats ({poblacions.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", maxHeight: "500px", overflowY: "auto" }}>
            {poblacions.map((p, idx) => (
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
            📊 Mètrics i Estadístiques ({analytics.length} esdeveniments recents)
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
                {analytics.map(a => (
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
      {cropperImageSrc && (
        <ImageCropperModal
          imageSrc={cropperImageSrc}
          aspectRatio={3 / 4}
          onClose={() => setCropperImageSrc(null)}
          onCropComplete={async (croppedBlob) => {
            setCropperImageSrc(null);
            setUploadingBg(true);
            try {
              const formData = new FormData();
              formData.append('file', croppedBlob, 'sponsor_bg.jpg');
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              const json = await res.json();
              if (json.url) {
                setNewSponsor(prev => ({ ...prev, imatgeFonsUrl: json.url }));
                setMsg("✅ Imatge de fons retallada i desada a Supabase!");
              } else {
                setMsg("❌ Error pujant la imatge de fons.");
              }
            } catch {
              setMsg("❌ Error de connexió en pujar la imatge.");
            } finally {
              setUploadingBg(false);
            }
          }}
        />
      )}
    </div>
  );
}
