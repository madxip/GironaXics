"use client";

import React, { useState, useTransition, useRef } from "react";
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
  X,
  Power,
  Upload,
  Trash2,
  BarChart2,
  Eye,
  TrendingUp
} from "lucide-react";
import { CRMCentre, CRMActivity } from "@/lib/crm";
import { 
  updateCentreAction, 
  createCentreAction, 
  getCentreActivitiesAction, 
  updateCRMActivityAction,
  toggleCentreActiuAction
} from "@/app/actions/crm";
import Toast from "@/components/Toast";
import Link from "next/link";

interface AdminCentresTabProps {
  initialCentres: CRMCentre[];
  poblacions: Record<string, string[]>;
  initialCentreId?: string;
}

export default function AdminCentresTab({ initialCentres, poblacions, initialCentreId }: AdminCentresTabProps) {
  const [centres, setCentres] = useState<CRMCentre[]>(initialCentres);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Modals / Drawer views
  const [editingCentre, setEditingCentre] = useState<CRMCentre | null>(null);
  const [managingActivitiesCentre, setManagingActivitiesCentre] = useState<CRMCentre | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Stats per centre
  type CentreStats = {
    totalViews: number; totalPhone: number; totalEmail: number; totalContacts: number;
    topActivitats: { label: string; views: number; phone: number; email: number }[];
    byDevice: { mobile: number; desktop: number };
    activitatCount: number; days: number;
  };
  const [centreStatsModal, setCentreStatsModal] = useState<CRMCentre | null>(null);
  const [centreStatsData, setCentreStatsData] = useState<CentreStats | null>(null);
  const [centreStatsLoading, setCentreStatsLoading] = useState(false);
  const [centreStatsDays, setCentreStatsDays] = useState(90);

  // Transitions
  const [isPending, startTransition] = useTransition();
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [centreActivities, setCentreActivities] = useState<CRMActivity[]>([]);
  const [togglingActiuId, setTogglingActiuId] = useState<string | null>(null);

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
  const [newImatgeUrl, setNewImatgeUrl] = useState("");
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

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
  const [editImatgeUrl, setEditImatgeUrl] = useState("");
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-obre el centre si ve des del formulari d'activitat
  React.useEffect(() => {
    if (initialCentreId && initialCentres.length > 0) {
      const centre = initialCentres.find(c => c.id === initialCentreId);
      if (centre) {
        handleManageActivities(centre);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Mostrar estadistiques d'un centre
  const handleShowStats = async (centre: CRMCentre, days = centreStatsDays) => {
    setCentreStatsModal(centre);
    setCentreStatsData(null);
    setCentreStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/centre-stats?centreId=${centre.id}&days=${days}`);
      const data = await res.json();
      setCentreStatsData(data);
    } catch {
      setToast({ type: "error", message: "No s'han pogut carregar les estadistiques." });
    } finally {
      setCentreStatsLoading(false);
    }
  };

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

  // Logo upload handler for Add modal
  const handleLogoUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingNew(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error en pujar el fitxer.");
      const data = await res.json();
      if (data.url) setNewImatgeUrl(data.url);
      else throw new Error(data.error || "No s'ha obtingut cap URL.");
    } catch {
      setToast({ type: "error", message: "No s'ha pogut pujar el logotip. Intenta-ho de nou." });
    } finally {
      setIsUploadingNew(false);
      if (newFileInputRef.current) newFileInputRef.current.value = "";
    }
  };

  // Logo upload handler for Edit form
  const handleLogoUploadEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEdit(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error en pujar el fitxer.");
      const data = await res.json();
      if (data.url) setEditImatgeUrl(data.url);
      else throw new Error(data.error || "No s'ha obtingut cap URL.");
    } catch {
      setToast({ type: "error", message: "No s'ha pogut pujar el logotip. Intenta-ho de nou." });
    } finally {
      setIsUploadingEdit(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
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
    setEditImatgeUrl(centre.imatgeUrl || "");

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
            descripcio: "",
            imatgeUrl: newImatgeUrl
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
          setNewImatgeUrl("");
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
            descripcio: editDescripcio,
            imatgeUrl: editImatgeUrl
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
                imatgeUrl: editImatgeUrl,
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
                    <th style={{ padding: "16px 20px", textAlign: "center" }}>Actiu</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCentres.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                        No s'ha trobat cap centre que coincideixi amb la cerca.
                      </td>
                    </tr>
                  ) : (
                    filteredCentres.map(c => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--crema-fosca)", opacity: c.actiu === false ? 0.5 : 1, transition: "opacity 0.3s" }} className="table-row-hover">
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
                              flexShrink: 0,
                              overflow: "hidden"
                            }}>
                              {c.imatgeUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.imatgeUrl} alt={c.nom} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "3px", boxSizing: "border-box" }} />
                              ) : (
                                c.nom.charAt(0).toUpperCase()
                              )}
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

                        {/* Toggle Actiu */}
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <button
                            title={c.actiu ? "Marcar com a Inactiu" : "Marcar com a Actiu"}
                            disabled={togglingActiuId === c.id}
                            onClick={() => {
                              const newActiu = !c.actiu;
                              setTogglingActiuId(c.id);
                              setCentres(prev => prev.map(x => x.id === c.id ? { ...x, actiu: newActiu } : x));
                              toggleCentreActiuAction(c.id, newActiu).then(res => {
                                setTogglingActiuId(null);
                                if (!res.success) {
                                  // Revert optimistic update
                                  setCentres(prev => prev.map(x => x.id === c.id ? { ...x, actiu: !newActiu } : x));
                                  setToast({ type: "error", message: res.error || "Error actualitzant l'estat" });
                                } else {
                                  setToast({ type: "success", message: `Centre ${newActiu ? "activat" : "desactivat"} correctament` });
                                }
                              });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: togglingActiuId === c.id ? "wait" : "pointer",
                              padding: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: c.actiu ? "var(--verd)" : "var(--muted)",
                              transition: "color 0.2s"
                            }}
                          >
                            {togglingActiuId === c.id
                              ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                              : <Power size={18} style={{ color: c.actiu ? "var(--verd)" : "#ccc" }} />
                            }
                            <span>{c.actiu ? "Actiu" : "Inactiu"}</span>
                          </button>
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
                            <button
                              onClick={() => handleShowStats(c)}
                              title="Estadistiques"
                              className="dashboard-action-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                backgroundColor: "#6366f1",
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
                              <BarChart2 size={13} />
                              <span>Stats</span>
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
            {/* Logotip del Centre - Edició */}
            <div style={{ marginBottom: "28px", padding: "20px", backgroundColor: "#f9fbf8", borderRadius: "12px", border: "1px solid var(--verd-pallid)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--verd-fosc)", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                Logotip del Centre
              </h3>
              <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "10px",
                  border: "2px dashed var(--crema-fosca)",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0
                }}>
                  {editImatgeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editImatgeUrl} alt="Logotip" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px", boxSizing: "border-box" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--muted)" }}>
                      <Building size={28} style={{ opacity: 0.35 }} />
                      <span style={{ fontSize: "10px", display: "block", marginTop: "4px" }}>Sense logo</span>
                    </div>
                  )}
                  {isUploadingEdit && (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 size={20} className="spinner" style={{ color: "var(--verd)" }} />
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="file" ref={editFileInputRef} onChange={handleLogoUploadEdit} accept="image/*" style={{ display: "none" }} />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isUploadingEdit}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px", borderRadius: "7px",
                        border: "1px solid var(--verd)", backgroundColor: "transparent",
                        color: "var(--verd)", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      <Upload size={14} /> Pujar logotip
                    </button>
                    {editImatgeUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImatgeUrl("")}
                        disabled={isUploadingEdit}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "8px 14px", borderRadius: "7px",
                          border: "1px solid #dc2626", backgroundColor: "transparent",
                          color: "#dc2626", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>
                    Format quadrat preferible (PNG, JPG). Mida màxima: 4MB.
                  </p>
                </div>
              </div>
            </div>

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

                {editingCentre && editingCentre.contactUserId ? (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Nom de la persona de contacte</label>
                      <input type="text" value={editContactNom} onChange={e => setEditContactNom(e.target.value)} style={inputStyle} />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--fosc)", marginBottom: "6px" }}>Email d&apos;accés / gestió (Intern)</label>
                      <input type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} style={inputStyle} placeholder="Email de login" />
                    </div>
                  </>
                ) : (
                  <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "12px", borderRadius: "6px", fontSize: "13px", border: "1px solid #fde68a" }}>
                    Aquest centre no té cap usuari de la web vinculat (va ser creat directament des d&apos;aquest panell d&apos;administració).
                  </div>
                )}
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

                  {/* Logotip */}
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: "8px 0 4px" }}>Logotip del Centre</h4>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "8px",
                      border: "2px dashed var(--crema-fosca)",
                      backgroundColor: "#fcfdfc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      flexShrink: 0
                    }}>
                      {newImatgeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={newImatgeUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px", boxSizing: "border-box" }} />
                      ) : (
                        <Building size={22} style={{ color: "var(--muted)", opacity: 0.4 }} />
                      )}
                      {isUploadingNew && (
                        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Loader2 size={16} className="spinner" style={{ color: "var(--verd)" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input type="file" ref={newFileInputRef} onChange={handleLogoUploadNew} accept="image/*" style={{ display: "none" }} />
                        <button
                          type="button"
                          onClick={() => newFileInputRef.current?.click()}
                          disabled={isUploadingNew}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "6px 10px", borderRadius: "6px",
                            border: "1px solid var(--verd)", backgroundColor: "transparent",
                            color: "var(--verd)", fontSize: "12px", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          <Upload size={12} /> Pujar
                        </button>
                        {newImatgeUrl && (
                          <button
                            type="button"
                            onClick={() => setNewImatgeUrl("")}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "6px 10px", borderRadius: "6px",
                              border: "1px solid #dc2626", backgroundColor: "transparent",
                              color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer"
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--muted)" }}>PNG/JPG, màx. 4MB</span>
                    </div>
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

      {/* PANEL D'ESTADÍSTIQUES DEL CENTRE */}
      {centreStatsModal && (
        <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid var(--verd-pallid)", padding: "30px", boxShadow: "0 4px 20px rgba(26,107,58,0.02)", marginTop: "24px" }}>
          {/* Capçalera */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", borderBottom: "1px solid var(--crema-fosca)", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => { setCentreStatsModal(null); setCentreStatsData(null); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "6px" }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--verd-fosc)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart2 size={20} /> Estadístiques: {centreStatsModal.nom}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                  Dades dels últims {centreStatsDays} dies
                </p>
              </div>
            </div>
            {/* Filtre de dies */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[30, 90, 180, 365].map(d => (
                <button key={d} onClick={() => { setCentreStatsDays(d); handleShowStats(centreStatsModal, d); }}
                  style={{ padding: "6px 12px", borderRadius: "20px", border: "1.5px solid", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    borderColor: centreStatsDays === d ? "#6366f1" : "var(--crema-fosca)",
                    backgroundColor: centreStatsDays === d ? "#6366f1" : "transparent",
                    color: centreStatsDays === d ? "white" : "var(--muted)" }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {centreStatsLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              <Loader2 size={32} className="spinner" style={{ margin: "0 auto 12px" }} />
              <p>Carregant estadístiques...</p>
            </div>
          ) : centreStatsData ? (
            <>
              {/* KPIs principals */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Visites a fitxes", value: centreStatsData.totalViews, icon: <Eye size={20} />, color: "#6366f1", bg: "#eef2ff" },
                  { label: "Clics a telèfon", value: centreStatsData.totalPhone, icon: <Phone size={20} />, color: "#059669", bg: "#d1fae5" },
                  { label: "Clics a email", value: centreStatsData.totalEmail, icon: <Mail size={20} />, color: "#d97706", bg: "#fef3c7" },
                  { label: "Total contactes", value: centreStatsData.totalContacts, icon: <TrendingUp size={20} />, color: "#dc2626", bg: "#fee2e2" },
                ].map(kpi => (
                  <div key={kpi.label} style={{ backgroundColor: kpi.bg, borderRadius: "12px", padding: "18px", textAlign: "center" }}>
                    <div style={{ color: kpi.color, marginBottom: "8px", display: "flex", justifyContent: "center" }}>{kpi.icon}</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                    <div style={{ fontSize: "11px", color: kpi.color, marginTop: "4px", fontWeight: 600, opacity: 0.8 }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Dispositius i activitats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                {/* Dispositius */}
                <div style={{ backgroundColor: "var(--crema)", borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "var(--fosc)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dispositius</h3>
                  {[
                    { label: "Mòbil 📱", value: centreStatsData.byDevice.mobile, total: centreStatsData.byDevice.mobile + centreStatsData.byDevice.desktop, color: "#6366f1" },
                    { label: "Escriptori 🖥️", value: centreStatsData.byDevice.desktop, total: centreStatsData.byDevice.mobile + centreStatsData.byDevice.desktop, color: "#059669" },
                  ].map(d => {
                    const pct = d.total > 0 ? Math.round((d.value / d.total) * 100) : 0;
                    return (
                      <div key={d.label} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                          <span>{d.label}</span><span style={{ fontWeight: 700 }}>{d.value} ({pct}%)</span>
                        </div>
                        <div style={{ backgroundColor: "white", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: d.color, borderRadius: "4px", transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--crema-fosca)", paddingTop: "12px" }}>
                    {centreStatsData.activitatCount} activitats registrades
                  </div>
                </div>

                {/* Top activitats */}
                <div style={{ backgroundColor: "var(--crema)", borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "var(--fosc)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Top activitats per visites</h3>
                  {centreStatsData.topActivitats.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
                      Sense dades per al període seleccionat
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                      {centreStatsData.topActivitats.map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "white", borderRadius: "8px", padding: "10px 12px" }}>
                          <span style={{ fontWeight: 800, color: "var(--muted)", fontSize: "12px", minWidth: "20px" }}>#{i+1}</span>
                          <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "var(--fosc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.label}>{a.label}</span>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <span title="Visites" style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#6366f1", fontWeight: 700 }}><Eye size={11} />{a.views}</span>
                            {a.phone > 0 && <span title="Trucades" style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#059669", fontWeight: 700 }}><Phone size={11} />{a.phone}</span>}
                            {a.email > 0 && <span title="Emails" style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#d97706", fontWeight: 700 }}><Mail size={11} />{a.email}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {centreStatsData.totalViews === 0 && centreStatsData.totalContacts === 0 && (
                <div style={{ textAlign: "center", padding: "12px", marginTop: "16px", fontSize: "13px", color: "var(--muted)", backgroundColor: "var(--crema)", borderRadius: "8px" }}>
                  💡 Les estadístiques es generen quan usuaris visiten les fitxes d{"'"}activitat i fan clic als botons de contacte.
                </div>
              )}
            </>
          ) : null}
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
