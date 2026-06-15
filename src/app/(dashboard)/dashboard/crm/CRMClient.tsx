"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  CheckCircle, 
  Building,
  Activity,
  Save,
  RefreshCw,
  Plus,
  MapPin,
  ClipboardList
} from "lucide-react";
import { CRMCentre, CRMActivity } from "@/lib/crm";
import { updateCentreAction, createCentreAction, getCentreActivitiesAction, updateCRMActivityAction } from "@/app/actions/crm";
import Toast from "@/components/Toast";
import { BARRIS_GIRONA } from "@/lib/barris";

interface CRMClientProps {
  initialCentres: CRMCentre[];
}

const BARRIS = BARRIS_GIRONA;

const CATEGORIES = [
  "Creativitat i Expressió",
  "Cuina",
  "Dansa",
  "Escacs",
  "Esports",
  "Idiomes",
  "Ioga",
  "Música",
  "Naturalesa",
  "Programació i robòtica",
  "Salut i benestar",
  "Teatre"
];

export default function CRMClient({ initialCentres }: CRMClientProps) {
  const [centres, setCentres] = useState<CRMCentre[]>(initialCentres);
  const [searchQuery, setSearchQuery] = useState("");
  const [barriFilter, setBarriFilter] = useState("Tots");
  
  // Selected centre for detail view
  const [selectedCentre, setSelectedCentre] = useState<CRMCentre | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "activities">("details");
  
  // Center edit form states
  const [editNom, setEditNom] = useState("");
  const [editAdreca, setEditAdreca] = useState("");
  const [editTelefon, setEditTelefon] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWeb, setEditWeb] = useState("");
  const [editBarri, setEditBarri] = useState("");
  const [editDescripcio, setEditDescripcio] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");

  // New Centre Modal states
  const [isAddCentreOpen, setIsAddCentreOpen] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newAdreca, setNewAdreca] = useState("");
  const [newTelefon, setNewTelefon] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWeb, setNewWeb] = useState("");
  const [newBarri, setNewBarri] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  // Activities states
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CRMActivity | null>(null);
  
  // Activity edit form states
  const [actNom, setActNom] = useState("");
  const [actBarri, setActBarri] = useState("");
  const [actCategoria, setActCategoria] = useState("");
  const [actEdat, setActEdat] = useState("");
  const [actPreu, setActPreu] = useState<number | string>("");
  const [actHorari, setActHorari] = useState("");
  const [actDies, setActDies] = useState("");
  const [actDescripcio, setActDescripcio] = useState("");
  const [actPublicada, setActPublicada] = useState(false);
  const [actDestacada, setActDestacada] = useState(false);

  // Global states
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load activities when switching to the activities tab or changing centre
  useEffect(() => {
    if (selectedCentre && activeTab === "activities") {
      setLoadingActivities(true);
      setSelectedActivity(null);
      getCentreActivitiesAction(selectedCentre.id, selectedCentre.nom)
        .then(data => {
          setActivities(data);
        })
        .catch(() => {
          setToast({ type: "error", message: "Error al carregar les activitats." });
        })
        .finally(() => {
          setLoadingActivities(false);
        });
    }
  }, [selectedCentre, activeTab]);

  // Open details drawer
  const handleOpenCentre = (centre: CRMCentre) => {
    setSelectedCentre(centre);
    setActiveTab("details");
    setSelectedActivity(null);
    
    // Set form fields
    setEditNom(centre.nom);
    setEditAdreca(centre.adreca);
    setEditTelefon(centre.telefon);
    setEditEmail(centre.email);
    setEditWeb(centre.web);
    setEditBarri(centre.barri);
    setEditDescripcio(centre.descripcio);
    setEditContactName(centre.contactName);
    setEditContactEmail(centre.contactEmail);
  };

  // Save changes to centre details
  const handleSaveCentre = async () => {
    if (!selectedCentre) return;
    setIsSaving(true);
    try {
      const res = await updateCentreAction(
        selectedCentre.id,
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
          nom: editContactName,
          email: editContactEmail
        }
      );

      if (res.success) {
        setCentres(prev => prev.map(c => {
          if (c.id === selectedCentre.id) {
            return {
              ...c,
              nom: editNom,
              adreca: editAdreca,
              telefon: editTelefon,
              email: editEmail,
              web: editWeb,
              barri: editBarri,
              descripcio: editDescripcio,
              contactName: editContactName,
              contactEmail: editContactEmail
            };
          }
          return c;
        }));
        setSelectedCentre(prev => prev ? {
          ...prev,
          nom: editNom,
          adreca: editAdreca,
          telefon: editTelefon,
          email: editEmail,
          web: editWeb,
          barri: editBarri,
          descripcio: editDescripcio,
          contactName: editContactName,
          contactEmail: editContactEmail
        } : null);
        setToast({ type: "success", message: "Centre desat correctament!" });
      } else {
        setToast({ type: "error", message: res.error || "No s'han pogut desar els canvis." });
      }
    } catch {
      setToast({ type: "error", message: "Error en desar el centre." });
    } finally {
      setIsSaving(false);
    }
  };

  // Create new centre
  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    setIsSaving(true);
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
          nom: newContactName,
          email: newContactEmail
        }
      );

      if (res.success && res.centre) {
        setCentres(prev => [res.centre!, ...prev]);
        setIsAddCentreOpen(false);
        // Clear fields
        setNewNom("");
        setNewAdreca("");
        setNewTelefon("");
        setNewEmail("");
        setNewWeb("");
        setNewBarri("");
        setNewContactName("");
        setNewContactEmail("");
        setToast({ type: "success", message: "Centre creat correctament!" });
        handleOpenCentre(res.centre);
      } else {
        setToast({ type: "error", message: res.error || "Error al crear el centre." });
      }
    } catch {
      setToast({ type: "error", message: "Error al connectar amb el servidor." });
    } finally {
      setIsSaving(false);
    }
  };

  // Open activity edit form
  const handleEditActivity = (activity: CRMActivity) => {
    setSelectedActivity(activity);
    setActNom(activity.nom);
    setActBarri(activity.barri);
    setActCategoria(activity.categoria);
    setActEdat(activity.edat);
    setActPreu(activity.preu);
    setActHorari(activity.horari);
    setActDies(activity.dies);
    setActDescripcio(activity.descripcio);
    setActPublicada(activity.publicada);
    setActDestacada(activity.destacada);
  };

  // Save changes to activity
  const handleSaveActivity = async () => {
    if (!selectedActivity || !selectedCentre) return;
    setIsSaving(true);
    try {
      const res = await updateCRMActivityAction(selectedActivity.id, {
        nom: actNom,
        barri: actBarri,
        categoria: actCategoria,
        edat: actEdat,
        preu: actPreu,
        horari: actHorari,
        dies: actDies,
        descripcio: actDescripcio,
        publicada: actPublicada,
        destacada: actDestacada
      });

      if (res.success) {
        setActivities(prev => prev.map(a => {
          if (a.id === selectedActivity.id) {
            return {
              ...a,
              nom: actNom,
              barri: actBarri,
              categoria: actCategoria,
              edat: actEdat,
              preu: actPreu,
              horari: actHorari,
              dies: actDies,
              descripcio: actDescripcio,
              publicada: actPublicada,
              destacada: actDestacada
            };
          }
          return a;
        }));
        setSelectedActivity(null);
        setToast({ type: "success", message: "Activitat actualitzada amb èxit!" });
      } else {
        setToast({ type: "error", message: res.error || "Error en actualitzar l'activitat." });
      }
    } catch {
      setToast({ type: "error", message: "Error en desar l'activitat." });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering
  const filteredCentres = centres.filter(c => {
    const matchesSearch = 
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.adreca.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.telefon.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBarri = barriFilter === "Tots" || c.barri === barriFilter;

    return matchesSearch && matchesBarri;
  });

  // Calculate dashboard stats
  const totalCentres = centres.length;
  const totalActivities = centres.reduce((sum, c) => sum + c.activityCount, 0);
  const activeCentresCount = centres.filter(c => c.activityCount > 0).length;

  return (
    <div>
      {/* Toast notifications */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 99999, width: "calc(100% - 48px)", maxWidth: "400px" }}>
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* KPI Cards */}
      <div className="crm-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        
        <div className="crm-kpi-card" style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", border: "1px solid rgba(26,107,58,0.08)", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>Total Centres</span>
            <div style={{ backgroundColor: "rgba(26,107,58,0.08)", color: "var(--verd)", padding: "6px", borderRadius: "8px" }}>
              <Building size={18} />
            </div>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--verd-fosc)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            {totalCentres}
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>Acadèmies, clubs i entitats registrades</p>
        </div>

        <div className="crm-kpi-card" style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", border: "1px solid rgba(26,107,58,0.08)", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>Centres Actius</span>
            <div style={{ backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563eb", padding: "6px", borderRadius: "8px" }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#2563eb", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            {activeCentresCount}
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>Centres amb activitats publicades</p>
        </div>

        <div className="crm-kpi-card" style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", border: "1px solid rgba(26,107,58,0.08)", boxShadow: "0 4px 20px rgba(26,107,58,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>Total Activitats</span>
            <div style={{ backgroundColor: "rgba(22, 163, 74, 0.08)", color: "#16a34a", padding: "6px", borderRadius: "8px" }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#16a34a", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            {totalActivities}
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0" }}>Activitats gestionades a GironaXics</p>
        </div>

      </div>

      {/* Filter and Actions Row */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "16px", 
        border: "1px solid rgba(26,107,58,0.08)", 
        boxShadow: "0 4px 20px rgba(26,107,58,0.02)",
        marginBottom: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Search bar */}
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex", alignItems: "center" }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cerca centre, adreça, contacte o email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: "8px",
                border: "1px solid var(--crema-fosca)",
                backgroundColor: "var(--crema)",
                color: "var(--fosc)",
                fontSize: "15px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Barrio filter */}
          <div style={{ flex: "0 1 200px", minWidth: "150px" }}>
            <select
              value={barriFilter}
              onChange={e => setBarriFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid var(--crema-fosca)",
                backgroundColor: "var(--crema)",
                color: "var(--fosc)",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none"
              }}
            >
              <option value="Tots">Tots els barris</option>
              {BARRIS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Add centre button */}
          <button
            onClick={() => setIsAddCentreOpen(true)}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--verd)",
              color: "white",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(26,107,58,0.15)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic"
            }}
          >
            <Plus size={16} />
            Afegir Centre
          </button>

        </div>
      </div>

      {/* Centres Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "16px", 
        border: "1px solid rgba(26,107,58,0.08)", 
        boxShadow: "0 4px 20px rgba(26,107,58,0.02)",
        overflow: "hidden"
      }}>
        {filteredCentres.length === 0 ? (
          <div style={{ padding: "60px 40px", textAlign: "center", color: "var(--muted)" }}>
            <Building size={40} style={{ color: "rgba(26,107,58,0.15)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", color: "var(--verd-fosc)", fontWeight: 700, marginBottom: "6px" }}>Cap centre trobat</h3>
            <p style={{ fontSize: "14px", margin: 0 }}>No hi ha cap centre que coincideixi amb els filtres.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f7f9f6", borderBottom: "1px solid rgba(26,107,58,0.08)", color: "var(--muted)", fontWeight: 700 }}>
                  <th style={{ padding: "16px 20px" }}>Nom del Centre</th>
                  <th style={{ padding: "16px 20px" }}>Persona de Contacte</th>
                  <th style={{ padding: "16px 20px" }}>Contacte Públic</th>
                  <th style={{ padding: "16px 20px" }}>Barri</th>
                  <th style={{ padding: "16px 20px" }}>Web</th>
                  <th style={{ padding: "16px 20px", textAlign: "center" }}>Activitats</th>
                  <th style={{ padding: "16px 20px", textAlign: "right" }}>Accions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCentres.map((centre) => (
                  <tr 
                    key={centre.id} 
                    className="crm-table-row"
                    onClick={() => handleOpenCentre(centre)}
                    style={{ 
                      borderBottom: "1px solid rgba(26,107,58,0.05)", 
                      cursor: "pointer", 
                      transition: "background 0.2s"
                    }}
                  >
                    <td style={{ padding: "16px 20px", fontWeight: 700, color: "var(--fosc)" }}>{centre.nom}</td>
                    <td style={{ padding: "16px 20px" }}>
                      {centre.contactName ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--fosc)" }}>{centre.contactName}</span>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{centre.contactEmail}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Sense contacte vinculat</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "13px" }}>
                        {centre.email && <span>✉ {centre.email}</span>}
                        {centre.telefon && <span>☎ {centre.telefon}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--muted)" }}>
                        <MapPin size={13} style={{ color: "var(--verd)" }} />
                        {centre.barri || "No definit"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {centre.web ? (
                        <a 
                          href={centre.web.startsWith('http') ? centre.web : `http://${centre.web}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: "var(--verd)", textDecoration: "none", fontWeight: 600 }}
                        >
                          Visitar ↗
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ 
                        backgroundColor: centre.activityCount > 0 ? "rgba(26, 107, 58, 0.1)" : "#f0f0f0", 
                        color: centre.activityCount > 0 ? "var(--verd-fosc)" : "var(--muted)", 
                        padding: "3px 10px", 
                        borderRadius: "99px",
                        fontWeight: 700,
                        fontSize: "12px"
                      }}>
                        {centre.activityCount}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCentre(centre);
                        }}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: "var(--verd)",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "13px"
                        }}
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Centre Modal */}
      {isAddCentreOpen && (
        <div 
          onClick={() => setIsAddCentreOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,26,24,0.45)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "32px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--verd-fosc)", fontFamily: "var(--font-serif)", fontStyle: "italic", margin: 0 }}>
                Afegir Nou Centre
              </h2>
              <button 
                onClick={() => setIsAddCentreOpen(false)}
                style={{ background: "none", border: "none", fontSize: "22px", color: "var(--muted)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCentre} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="new-nom" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Nom del Centre</label>
                  <input id="new-nom" type="text" required value={newNom} onChange={e => setNewNom(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="Club de Bàsquet Girona" />
                </div>
                <div>
                  <label htmlFor="new-barri" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Barri</label>
                  <select id="new-barri" required value={newBarri} onChange={e => setNewBarri(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px", backgroundColor: "white" }}>
                    <option value="">Selecciona barri...</option>
                    {BARRIS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="new-telefon" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Telèfon de Contacte</label>
                  <input id="new-telefon" type="text" value={newTelefon} onChange={e => setNewTelefon(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="972 000 000" />
                </div>
                <div>
                  <label htmlFor="new-email" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Email Públic</label>
                  <input id="new-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="hola@clubbasquet.cat" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="new-adreca" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Adreça Física</label>
                  <input id="new-adreca" type="text" value={newAdreca} onChange={e => setNewAdreca(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="Carrer de Fontajau, s/n" />
                </div>
                <div>
                  <label htmlFor="new-web" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Adreça Web</label>
                  <input id="new-web" type="text" value={newWeb} onChange={e => setNewWeb(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="www.clubbasquet.cat" />
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(26,107,58,0.08)", margin: "8px 0" }} />
              
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: "0 0 8px 0" }}>Persona de Contacte Principal (Gestor)</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="new-cname" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Nom Responsable</label>
                  <input id="new-cname" type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="Martí Puig" />
                </div>
                <div>
                  <label htmlFor="new-cemail" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Email Responsable</label>
                  <input id="new-cemail" type="email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} placeholder="martipuig@gmail.com" />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddCentreOpen(false)}
                  style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--crema-fosca)", backgroundColor: "white", color: "var(--muted)", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: "10px 24px", borderRadius: "6px", border: "none", backgroundColor: "var(--verd)", color: "white", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
                >
                  {isSaving ? "Creant..." : "Crear Centre"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Detail side drawer */}
      {selectedCentre && (
        <div 
          onClick={() => setSelectedCentre(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(26,26,24,0.45)",
            zIndex: 10000,
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "white",
              height: "100%",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* Drawer Header */}
            <div style={{ 
              padding: "24px 32px", 
              borderBottom: "1px solid rgba(26,107,58,0.08)", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              backgroundColor: "#f7f9f6"
            }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--verd-fosc)", fontFamily: "var(--font-serif)", fontStyle: "italic", margin: 0 }}>
                  {selectedCentre.nom}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  ID: {selectedCentre.id} · {selectedCentre.activityCount} activitats
                </span>
              </div>
              <button 
                onClick={() => setSelectedCentre(null)}
                style={{ background: "none", border: "none", fontSize: "22px", color: "var(--muted)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(26,107,58,0.08)" }}>
              <button
                onClick={() => { setActiveTab("details"); setSelectedActivity(null); }}
                style={{
                  flex: 1,
                  padding: "16px",
                  border: "none",
                  backgroundColor: "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: activeTab === "details" ? "var(--verd-fosc)" : "var(--muted)",
                  borderBottom: activeTab === "details" ? "3px solid var(--verd)" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Building size={16} />
                  Dades del Centre
                </span>
              </button>
              <button
                onClick={() => { setActiveTab("activities"); setSelectedActivity(null); }}
                style={{
                  flex: 1,
                  padding: "16px",
                  border: "none",
                  backgroundColor: "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: activeTab === "activities" ? "var(--verd-fosc)" : "var(--muted)",
                  borderBottom: activeTab === "activities" ? "3px solid var(--verd)" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <ClipboardList size={16} />
                  Activitats
                </span>
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: "32px", flex: 1, overflowY: "auto" }}>
              
              {/* Tab 1: Centre details */}
              {activeTab === "details" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  <div>
                    <label htmlFor="edit-nom" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Nom Comercial</label>
                    <input id="edit-nom" type="text" value={editNom} onChange={e => setEditNom(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label htmlFor="edit-telefon" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Telèfon</label>
                      <input id="edit-telefon" type="text" value={editTelefon} onChange={e => setEditTelefon(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                    </div>
                    <div>
                      <label htmlFor="edit-email" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Email de Contacte Públic</label>
                      <input id="edit-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label htmlFor="edit-barri" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Barri</label>
                      <select id="edit-barri" value={editBarri} onChange={e => setEditBarri(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px", backgroundColor: "white" }}>
                        <option value="">No definit</option>
                        {BARRIS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-web" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Web</label>
                      <input id="edit-web" type="text" value={editWeb} onChange={e => setEditWeb(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="edit-adreca" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Adreça Física</label>
                    <input id="edit-adreca" type="text" value={editAdreca} onChange={e => setEditAdreca(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                  </div>

                  <div>
                    <label htmlFor="edit-desc" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Descripció</label>
                    <textarea id="edit-desc" rows={4} value={editDescripcio} onChange={e => setEditDescripcio(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px", resize: "vertical", fontFamily: "var(--font-sans)", boxSizing: "border-box" }} />
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid rgba(26,107,58,0.08)", margin: "8px 0" }} />
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--verd-fosc)", margin: 0 }}>Persona de Contacte Principal (Gestor)</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label htmlFor="edit-cname" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Nom Complet</label>
                      <input id="edit-cname" type="text" value={editContactName} onChange={e => setEditContactName(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                    </div>
                    <div>
                      <label htmlFor="edit-cemail" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "6px" }}>Email d'Accés</label>
                      <input id="edit-cemail" type="email" value={editContactEmail} onChange={e => setEditContactEmail(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid var(--crema-fosca)", borderRadius: "6px", fontSize: "14px" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <button
                      onClick={handleSaveCentre}
                      disabled={isSaving}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "var(--verd)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 12px rgba(26,107,58,0.12)"
                      }}
                    >
                      {isSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                      Desar Dades del Centre
                    </button>
                  </div>

                </div>
              )}

              {/* Tab 2: Activities */}
              {activeTab === "activities" && (
                <div>
                  
                  {loadingActivities ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                      <RefreshCw size={24} className="spin" style={{ marginBottom: "12px" }} />
                      <p>Carregant activitats...</p>
                    </div>
                  ) : selectedActivity ? (
                    
                    /* EDITING ONE ACTIVITY WITHIN THE CRM */
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h4 style={{ margin: 0, color: "var(--verd-fosc)", fontWeight: 700, fontSize: "16px" }}>
                          Editar Activitat: {selectedActivity.nom}
                        </h4>
                        <button 
                          onClick={() => setSelectedActivity(null)}
                          style={{ background: "none", border: "none", color: "var(--muted)", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
                        >
                          ← Tornar a la llista
                        </button>
                      </div>

                      <div>
                        <label htmlFor="act-nom" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Nom de l'Activitat</label>
                        <input id="act-nom" type="text" value={actNom} onChange={e => setActNom(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px" }} />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label htmlFor="act-categoria" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Categoria</label>
                          <select id="act-categoria" value={actCategoria} onChange={e => setActCategoria(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "13px", backgroundColor: "white" }}>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="act-barri" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Barri</label>
                          <select id="act-barri" value={actBarri} onChange={e => setActBarri(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "13px", backgroundColor: "white" }}>
                            {BARRIS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label htmlFor="act-edat" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Edat</label>
                          <input id="act-edat" type="text" value={actEdat} onChange={e => setActEdat(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px" }} placeholder="ex: 6-12 anys" />
                        </div>
                        <div>
                          <label htmlFor="act-preu" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Preu (€/mes)</label>
                          <input id="act-preu" type="text" value={actPreu} onChange={e => setActPreu(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px" }} placeholder="ex: 35" />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label htmlFor="act-horari" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Horari</label>
                          <input id="act-horari" type="text" value={actHorari} onChange={e => setActHorari(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px" }} placeholder="ex: 17:00-18:30" />
                        </div>
                        <div>
                          <label htmlFor="act-dies" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Dies</label>
                          <input id="act-dies" type="text" value={actDies} onChange={e => setActDies(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px" }} placeholder="ex: Dimarts i Dijous" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="act-desc" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--verd)", textTransform: "uppercase", marginBottom: "4px" }}>Descripció</label>
                        <textarea id="act-desc" rows={4} value={actDescripcio} onChange={e => setActDescripcio(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid var(--crema-fosca)", borderRadius: "4px", fontSize: "14px", resize: "vertical", fontFamily: "var(--font-sans)", boxSizing: "border-box" }} />
                      </div>

                      {/* Toggles */}
                      <div style={{ display: "flex", gap: "24px", margin: "8px 0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                          <input type="checkbox" checked={actPublicada} onChange={e => setActPublicada(e.target.checked)} />
                          Activitat Publicada
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                          <input type="checkbox" checked={actDestacada} onChange={e => setActDestacada(e.target.checked)} />
                          Destacada al Recull
                        </label>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(null)}
                          style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--crema-fosca)", backgroundColor: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Cancel·lar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveActivity}
                          disabled={isSaving}
                          style={{ padding: "8px 20px", borderRadius: "6px", border: "none", backgroundColor: "var(--verd)", color: "white", fontSize: "13px", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
                        >
                          {isSaving ? "Desant..." : "Desar Activitat"}
                        </button>
                      </div>

                    </div>
                  ) : (
                    
                    /* LIST OF ACTIVITIES */
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      
                      {activities.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
                          <Activity size={32} style={{ color: "rgba(26,107,58,0.12)", marginBottom: "12px" }} />
                          <p style={{ margin: 0, fontSize: "14px" }}>Aquest centre encara no té cap activitat registrada.</p>
                        </div>
                      ) : (
                        activities.map(act => (
                          <div 
                            key={act.id} 
                            style={{ 
                              backgroundColor: "var(--crema)", 
                              padding: "16px 20px", 
                              borderRadius: "12px", 
                              border: "1px solid var(--crema-fosca)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 700, color: "var(--verd-fosc)", fontSize: "15px" }}>
                                  {act.nom}
                                </span>
                                <span style={{ 
                                  fontSize: "10.5px", 
                                  fontWeight: 700, 
                                  textTransform: "uppercase", 
                                  backgroundColor: act.publicada ? "rgba(22, 163, 74, 0.1)" : "#f0f0f0",
                                  color: act.publicada ? "#16a34a" : "var(--muted)",
                                  padding: "2px 8px",
                                  borderRadius: "4px"
                                }}>
                                  {act.publicada ? "Publicada" : "Esborrany"}
                                </span>
                              </div>
                              <div style={{ fontSize: "13px", color: "var(--muted)", display: "flex", gap: "12px" }}>
                                <span>{act.categoria}</span>
                                <span>·</span>
                                <span>{act.edat}</span>
                                <span>·</span>
                                <span style={{ fontWeight: 700 }}>{act.preu != null && act.preu !== 0 ? `${act.preu}€/mes` : 'Gratuït'}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEditActivity(act)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "1px solid var(--crema-fosca)",
                                backgroundColor: "white",
                                color: "var(--verd-fosc)",
                                fontWeight: 700,
                                fontSize: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              Editar
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Global CSS declarations for micro-animations */}
      <style jsx global>{`
        .crm-table-row:hover {
          background-color: rgba(26, 107, 58, 0.02) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
