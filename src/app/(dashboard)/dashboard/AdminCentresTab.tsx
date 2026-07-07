"use client";

import React, { useState, useTransition } from "react";
import { 
  Search, 
  Building, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Edit2, 
  Activity, 
  ArrowLeft, 
  Loader2,
  Tag,
  Copy,
  X
} from "lucide-react";
import { CRMCentre, CRMActivity } from "@/lib/crm";
import { 
  updateCentreAction, 
  createCentreAction, 
  getCentreActivitiesAction, 
  updateCRMActivityAction 
} from "@/app/actions/crm";
import Toast from "@/components/Toast";
import Link from "next/link";

interface AdminCentresTabProps {
  initialCentres: CRMCentre[];
  poblacions: Record<string, string[]>;
}

export default function AdminCentresTab({ initialCentres, poblacions }: AdminCentresTabProps) {
  const [centres, setCentres] = useState<CRMCentre[]>(initialCentres);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Modals / Drawer views
  const [editingCentre, setEditingCentre] = useState<CRMCentre | null>(null);
  const [managingActivitiesCentre, setManagingActivitiesCentre] = useState<CRMCentre | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Transitions
  const [isPending, startTransition] = useTransition();
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [centreActivities, setCentreActivities] = useState<CRMActivity[]>([]);

  // Add Centre Form States
  const [newNom, setNewNom] = useState("");
  const [newAdreca, setNewAdreca] = useState("");
  const [newTelefon, setNewTelefon] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWeb, setNewWeb] = useState("");
  const [newComarca, setNewComarca] = useState("");
  const [newBarri, setNewBarri] = useState("");
  const [newContactNom, setNewContactNom] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  // Edit Centre Form States
  const [editNom, setEditNom] = useState("");
  const [editAdreca, setEditAdreca] = useState("");
  const [editTelefon, setEditTelefon] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWeb, setEditWeb] = useState("");
  const [editComarca, setEditComarca] = useState("");
  const [editBarri, setEditBarri] = useState("");
  const [editContactNom, setEditContactNom] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editDescripcio, setEditDescripcio] = useState("");

  // Filtered centres
  const filteredCentres = centres.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.nom || "").toLowerCase().includes(query) ||
      (c.barri || "").toLowerCase().includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.telefon || "").toLowerCase().includes(query)
    );
  });



  // Load activities for a specific centre
  const handleManageActivities = async (centre: CRMCentre) => {
    setManagingActivitiesCentre(centre);
    setLoadingActivities(true);
    try {
      const acts = await getCentreActivitiesAction(centre.id, centre.nom);
      setCentreActivities(acts);
    } catch {
      setToast({ type: "error", message: "No s'han pogut carregar les activitats." });
    } finally {
      setLoadingActivities(false);
    }
  };

  // Open Edit Profile modal
  const handleEditCentre = (centre: CRMCentre) => {
    setEditingCentre(centre);
    setEditNom(centre.nom || "");
    setEditAdreca(centre.adreca || "");
    setEditTelefon(centre.telefon || "");
    setEditEmail(centre.email || "");
    setEditWeb(centre.web || "");
    setEditBarri(centre.barri || "");
    setEditDescripcio(centre.descripcio || "");
    setEditContactNom(centre.contactName || "");
    setEditContactEmail(centre.contactEmail || "");

    let comarca = "";
    if (centre.barri) {
      for (const [comarcaName, towns] of Object.entries(poblacions)) {
        if (towns.includes(centre.barri)) {
          comarca = comarcaName;
          break;
        }
      }
    }
    setEditComarca(comarca);
  };

  // Create centre handler
  const handleCreateCentreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    
    startTransition(async () => {
      try {
        const res = await createCentreAction(
          newNom,
          {
            adreca: newAdreca,
            telefon: newTelefon,
            email: newEmail,
            web: newWeb,
            barri: newBarri,
            descripcio: ""
          },
          {
            nom: newContactNom,
            email: newContactEmail
          }
        );

        if (res.success && res.centre) {
          setCentres(prev => [res.centre!, ...prev]);
          setIsAddModalOpen(false);
          setToast({ type: "success", message: "Centre creat correctament!" });
          
          // Clear form fields
          setNewNom("");
          setNewAdreca("");
          setNewTelefon("");
          setNewEmail("");
          setNewWeb("");
          setNewComarca("");
          setNewBarri("");
          setNewContactNom("");
          setNewContactEmail("");
        } else {
          setToast({ type: "error", message: res.error || "Error en crear el centre." });
        }
      } catch {
        setToast({ type: "error", message: "Error de connexió." });
      }
    });
  };

  // Update centre handler
  const handleUpdateCentreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCentre || !editNom.trim()) return;

    startTransition(async () => {
      try {
        const res = await updateCentreAction(
          editingCentre.id,
          {
            nom: editNom,
            adreca: editAdreca,
            telefon: editTelefon,
            email: editEmail,
            web: editWeb,
            barri: editBarri,
            descripcio: editDescripcio
          },
          {
            nom: editContactNom,
            email: editContactEmail
          }
        );

        if (res.success) {
          setCentres(prev => prev.map(c => {
            if (c.id === editingCentre.id) {
              return {
                ...c,
                nom: editNom,
                adreca: editAdreca,
                telefon: editTelefon,
                email: editEmail,
                web: editWeb,
                barri: editBarri,
                descripcio: editDescripcio,
                contactName: editContactNom,
                contactEmail: editContactEmail
              };
            }
            return c;
          }));
          setEditingCentre(null);
          setToast({ type: "success", message: "Perfil del centre actualitzat amb èxit." });
        } else {
          setToast({ type: "error", message: res.error || "Error al desar els canvis." });
        }
      } catch {
        setToast({ type: "error", message: "Error de connexió." });
      }
    });
  };

  // Toggle activity state (publicada)
  const handleToggleActivity = async (act: CRMActivity) => {
    try {
      const nextPublicada = !act.publicada;
      const res = await updateCRMActivityAction(act.id, { publicada: nextPublicada });
      if (res.success) {
        setCentreActivities(prev => prev.map(a => a.id === act.id ? { ...a, publicada: nextPublicada } : a));
        setToast({ type: "success", message: nextPublicada ? "Activitat publicada!" : "Activitat guardada com a esborrany." });
      } else {
        setToast({ type: "error", message: res.error || "No s'ha pogut canviar l'estat." });
      }
    } catch {
      setToast({ type: "error", message: "Error al connectar amb Airtable." });
    }
  };

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* VISTA PRINCIPAL DE LLISTAT DE CENTRES */}
      {!managingActivitiesCentre && !editingCentre && (
        <>
          {/* Cercador i afegir centre */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1", minWidth: "280px", maxWidth: "480px" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input 
                type="text" 
                placeholder="Cerca centre per nom, barri, telèfon..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid var(--crema-fosca)",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: "white",
                  color: "var(--fosc)"
                }}
              />
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--verd)",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                transition: "all 0.2s"
              }}
            >
              <Plus size={18} /> Afegir Centre
            </button>
          </div>

          {/* Taula de centres */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", overflow: "hidden", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse", textAlign: "left", fontSize: "14.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--crema-fosca)", borderBottom: "1px solid rgba(26,107,58,0.1)", color: "var(--verd-fosc)", fontWeight: 700 }}>
                    <th style={{ padding: "16px 20px" }}>Centre</th>
                    <th style={{ padding: "16px 20px" }}>Municipi / Barri</th>
                    <th style={{ padding: "16px 20px" }}>Dades de Contacte</th>
                    <th style={{ padding: "16px 20px" }}>Activitats</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCentres.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                        No s'ha trobat cap centre que coincideixi amb la cerca.
                      </td>
                    </tr>
                  ) : (
                    filteredCentres.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--crema-fosca)" }} className="table-row-hover">
                        {/* Nom i Logo */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(26,107,58,0.05)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--verd-fosc)",
                              fontWeight: 700,
                              fontSize: "14px",
                              border: "1.5px solid var(--verd-pallid)",
                              flexShrink: 0
                            }}>
                              {c.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "var(--verd-fosc)" }}>{c.nom}</div>
                              {c.contactName && (
                                <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                  <User size={10} /> {c.contactName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Població */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13.5px" }}>
                            <MapPin size={13} style={{ color: "var(--verd)" }} />
                            <span>{c.barri || "Girona"}</span>
                          </div>
                        </td>

                        {/* Contacte */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                            {c.telefon && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={12} style={{ color: "var(--muted)" }} /> {c.telefon}</div>}
                            {c.email && <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Mail size={12} style={{ color: "var(--muted)" }} /> {c.email}</div>}
                          </div>
                        </td>

                        {/* Nombre d'activitats */}
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "6px", 
                            fontWeight: 600, 
                            fontSize: "13px", 
                            padding: "4px 10px", 
                            borderRadius: "12px", 
                            backgroundColor: c.activityCount > 0 ? "rgba(26,107,58,0.06)" : "#f5f5f5",
                            color: c.activityCount > 0 ? "var(--verd-fosc)" : "var(--muted)",
                            border: c.activityCount > 0 ? "1px solid rgba(26,107,58,0.12)" : "1px solid #e0e0e0"
                          }}>
                            <Activity size={12} /> {c.activityCount || 0}
                          </span>
                        </td>

                        {/* Accions */}
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => handleEditCentre(c)}
                              title="Editar Perfil"
                              className="dashboard-action-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "white",
                                color: "var(--fosc)",
                                border: "1px solid var(--crema-fosca)",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 500,
                                transition: "all 0.2s"
                              }}
                            >
                              <Edit2 size={13} />
                              <span>Edita</span>
                            </button>
                            <button 
                              onClick={() => handleManageActivities(c)}
                              title="Gestionar Activitats"
                              className="dashboard-action-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "var(--verd-fosc)",
                                color: "white",
                                border: "none",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 500,
                                transition: "all 0.2s"
                              }}
                            >
                              <Activity size={13} />
                              <span>Activitats</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SECCIÓ: FORMULARI PERFIL CENTRE EDICIÓ */}
      {editingCentre && (
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", padding: "30px", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", borderBottom: "1px solid var(--crema-fosca)", paddingBottom: "16px" }}>
            <button 
              onClick={() => setEditingCentre(null)}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "6px" }}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ margin: 0, fontSize: "24px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>
              Perfil de: {editingCentre.nom}
            </h2>
          </div>

          <form onSubmit={handleUpdateCentreSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }} className="af-row-2">
              {/* DADES GENERALS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--verd-fosc)", marginTop: 0, marginBottom: "8px", borderBottom: "1px dashed rgba(26,107,58,0.15)", paddingBottom: "6px" }}>
                  Informació General
                </h3>
                
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Nom del Centre *</label>
                  <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} required style={inputStyle} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Comarca *</label>
                    <select 
                      value={editComarca} 
                      onChange={e => { setEditComarca(e.target.value); setEditBarri(""); }} 
                      required 
                      style={selectStyle}
                    >
                      <option value="">-- Tria comarca --</option>
                      {Object.keys(poblacions).map(com => <option key={com} value={com}>{com}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Població / Barri *</label>
                    <select 
                      value={editBarri} 
                      onChange={e => setEditBarri(e.target.value)} 
                      required 
                      disabled={!editComarca}
                      style={selectStyle}
                    >
                      <option value="">-- Tria població --</option>
                      {editComarca && (poblacions[editComarca] || []).map(bar => <option key={bar} value={bar}>{bar}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Adreça Física</label>
                  <input type="text" value={editAdreca} onChange={e => setEditAdreca(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Descripció del Centre</label>
                  <textarea value={editDescripcio} onChange={e => setEditDescripcio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="Breu descripció..." />
                </div>
              </div>

              {/* DADES DE CONTACTE I ACCÉS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--verd-fosc)", marginTop: 0, marginBottom: "8px", borderBottom: "1px dashed rgba(26,107,58,0.15)", paddingBottom: "6px" }}>
                  Contacte del Centre
                </h3>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Telèfon del Centre</label>
                  <input type="text" value={editTelefon} onChange={e => setEditTelefon(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Email Públic (per a famílies)</label>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Pàgina Web</label>
                  <input type="text" value={editWeb} onChange={e => setEditWeb(e.target.value)} style={inputStyle} placeholder="https://example.com" />
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--verd-fosc)", marginTop: "12px", marginBottom: "8px", borderBottom: "1px dashed rgba(26,107,58,0.15)", paddingBottom: "6px" }}>
                  Persona de Contacte (Gestió Interna)
                </h3>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Nom de la persona de contacte</label>
                  <input type="text" value={editContactNom} onChange={e => setEditContactNom(e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Email d&apos;accés / gestió (Intern)</label>
                  <input type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} style={inputStyle} placeholder="Email de login" />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--crema-fosca)", paddingTop: "24px" }}>
              <button 
                type="button"
                onClick={() => setEditingCentre(null)}
                style={{
                  backgroundColor: "white",
                  color: "var(--fosc)",
                  border: "1px solid var(--crema-fosca)",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Cancel·lar
              </button>
              <button 
                type="submit"
                disabled={isPending}
                style={{
                  backgroundColor: "var(--verd)",
                  color: "white",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {isPending && <Loader2 size={16} className="spinner" />}
                Desar Perfil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECCIÓ: GESTIÓ D'ACTIVITATS DEL CENTRE */}
      {managingActivitiesCentre && (
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", padding: "30px", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid var(--crema-fosca)", paddingBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                onClick={() => setManagingActivitiesCentre(null)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "6px" }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: "24px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>
                  Activitats de: {managingActivitiesCentre.nom}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                  Publica, edita o afegeix extraescolars, tallers o casals per a aquest centre.
                </p>
              </div>
            </div>

            <Link 
              href={`/dashboard/activitats/nova?centreId=${managingActivitiesCentre.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--verd)",
                color: "white",
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic"
              }}
            >
              <Plus size={16} /> Afegir Activitat
            </Link>
          </div>

          {loadingActivities ? (
            <div style={{ padding: "80px", textAlign: "center", color: "var(--muted)" }}>
              <Loader2 size={36} className="spinner" style={{ color: "var(--verd)", margin: "0 auto 16px" }} />
              Carregant les activitats del centre...
            </div>
          ) : centreActivities.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center", backgroundColor: "#f9fbf8", borderRadius: "12px", border: "1px dashed var(--verd-pallid)" }}>
              <Building size={32} style={{ color: "var(--muted)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", color: "var(--verd-fosc)", margin: "0 0 8px" }}>Cap activitat publicada encara</h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "420px", margin: "0 auto 20px" }}>
                Aquest centre encara no té cap activitat. Clica a &apos;Afegir Activitat&apos; per començar a registrar extraescolars, tallers o casals.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", textAlign: "left", fontSize: "14.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fbf8", borderBottom: "1.5px solid var(--crema-fosca)", color: "var(--verd-fosc)", fontWeight: 700 }}>
                    <th style={{ padding: "14px 16px" }}>Activitat</th>
                    <th style={{ padding: "14px 16px" }}>Tipus / Categoria</th>
                    <th style={{ padding: "14px 16px" }}>Edat</th>
                    <th style={{ padding: "14px 16px" }}>Horari / Dies</th>
                    <th style={{ padding: "14px 16px" }}>Preu</th>
                    <th style={{ padding: "14px 16px" }}>Estat</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {centreActivities.map(act => (
                    <tr key={act.id} style={{ borderBottom: "1px solid var(--crema-fosca)" }}>
                      {/* Nom */}
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--verd-fosc)" }}>
                        {act.nom}
                      </td>

                      {/* Tipus / Categoria */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--verd)" }}>
                            {act.tipus || "Extraescolar"}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--fosc)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Tag size={10} /> {act.categoria}
                          </span>
                        </div>
                      </td>

                      {/* Edat */}
                      <td style={{ padding: "14px 16px", fontSize: "13.5px" }}>
                        {act.edat}
                      </td>

                      {/* Horari */}
                      <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                        <div>{act.dies}</div>
                        <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "2px" }}>{act.horari}</div>
                      </td>

                      {/* Preu */}
                      <td style={{ padding: "14px 16px", fontSize: "13.5px" }}>
                        {act.preu ? `${act.preu}` : "A consultar"}
                      </td>

                      {/* Estat (Draft vs Publicat) */}
                      <td style={{ padding: "14px 16px" }}>
                        <button 
                          onClick={() => handleToggleActivity(act)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            backgroundColor: act.publicada ? "rgba(26,107,58,0.08)" : "rgba(0,0,0,0.05)",
                            color: act.publicada ? "var(--verd-fosc)" : "var(--muted)",
                            transition: "all 0.15s"
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: act.publicada ? "var(--verd)" : "var(--muted)" }} />
                          {act.publicada ? "Publicada" : "Esborrany"}
                        </button>
                      </td>

                      {/* Accions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <Link 
                            href={`/dashboard/activitats/nova?duplicateFrom=${act.id}`}
                            className="dashboard-action-btn"
                            title="Duplicar activitat"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              backgroundColor: "white",
                              color: "var(--verd)",
                              border: "1px solid var(--crema-fosca)",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontSize: "12.5px"
                            }}
                          >
                            <Copy size={12} />
                          </Link>
                          <Link 
                            href={`/dashboard/activitats/${act.id}/editar`}
                            className="dashboard-action-btn"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              backgroundColor: "white",
                              color: "var(--fosc)",
                              border: "1px solid var(--crema-fosca)",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              textDecoration: "none",
                              fontSize: "12.5px"
                            }}
                          >
                            <Edit2 size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: AFEGIR NOU CENTRE */}
      {isAddModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "720px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "30px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            position: "relative"
          }}>
            <button 
              onClick={() => setIsAddModalOpen(false)}
              style={{
                position: "absolute",
                right: "20px",
                top: "20px",
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: "0 0 24px", fontSize: "22px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)" }}>
              Registrar Nou Centre
            </h2>

            <form onSubmit={handleCreateCentreSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }} className="af-row-2">
                
                {/* Dades generals */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: "0 0 4px" }}>Informació del Centre</h4>
                  
                  <div>
                    <label style={modalLabelStyle}>Nom del Centre *</label>
                    <input type="text" value={newNom} onChange={e => setNewNom(e.target.value)} required style={inputStyle} placeholder="Ex: Escola de Música Girona" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={modalLabelStyle}>Comarca *</label>
                      <select value={newComarca} onChange={e => { setNewComarca(e.target.value); setNewBarri(""); }} required style={selectStyle}>
                        <option value="">Tria...</option>
                        {Object.keys(poblacions).map(com => <option key={com} value={com}>{com}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Municipi *</label>
                      <select value={newBarri} onChange={e => setNewBarri(e.target.value)} required disabled={!newComarca} style={selectStyle}>
                        <option value="">Tria...</option>
                        {newComarca && (poblacions[newComarca] || []).map(bar => <option key={bar} value={bar}>{bar}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={modalLabelStyle}>Adreça física</label>
                    <input type="text" value={newAdreca} onChange={e => setNewAdreca(e.target.value)} style={inputStyle} placeholder="Carrer, número, pis..." />
                  </div>

                  <div>
                    <label style={modalLabelStyle}>Telèfon del centre</label>
                    <input type="text" value={newTelefon} onChange={e => setNewTelefon(e.target.value)} style={inputStyle} placeholder="Ex: 972 00 00 00" />
                  </div>
                </div>

                {/* Dades de contacte */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: "0 0 4px" }}>Contacte i Comptes</h4>

                  <div>
                    <label style={modalLabelStyle}>Email públic del centre</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} placeholder="info@centre.com" />
                  </div>

                  <div>
                    <label style={modalLabelStyle}>Pàgina web</label>
                    <input type="text" value={newWeb} onChange={e => setNewWeb(e.target.value)} style={inputStyle} placeholder="https://www.centre.com" />
                  </div>

                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: "8px 0 4px" }}>Persona Responsable (Intern)</h4>

                  <div>
                    <label style={modalLabelStyle}>Nom de la persona de contacte</label>
                    <input type="text" value={newContactNom} onChange={e => setNewContactNom(e.target.value)} style={inputStyle} placeholder="Ex: Maria Garcia" />
                  </div>

                  <div>
                    <label style={modalLabelStyle}>Email d&apos;accés (Login)</label>
                    <input type="email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} style={inputStyle} placeholder="usuari@gironaxics.cat" />
                  </div>
                </div>

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--crema-fosca)", paddingTop: "20px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    backgroundColor: "white",
                    color: "var(--fosc)",
                    border: "1px solid var(--crema-fosca)",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel·lar
                </button>
                <button 
                  type="submit"
                  disabled={isPending}
                  style={{
                    backgroundColor: "var(--verd)",
                    color: "white",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {isPending && <Loader2 size={14} className="spinner" />}
                  Crear Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILS DE LA TAULA I MÒBIL */}
      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background-color: #fafbf9 !important;
        }
        @media (max-width: 768px) {
          .af-row-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
    </div>
  );
}

// Reusable styles
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid var(--crema-fosca)",
  fontSize: "14px",
  outline: "none",
  color: "var(--fosc)",
  backgroundColor: "#fcfdfc"
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid var(--crema-fosca)",
  fontSize: "14px",
  outline: "none",
  color: "var(--fosc)",
  backgroundColor: "#fcfdfc",
  cursor: "pointer"
};

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: "4px"
};
