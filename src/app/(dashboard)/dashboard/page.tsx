import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getActivitatsByCentreId, getCentres } from "@/lib/airtable";
import Link from "next/link";
import { Plus, Edit2, MapPin, Calendar, CircleDollarSign, Tag, Info, Activity } from "lucide-react";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return null; // Layout will handle redirect
  }

  const centreId = session.user.centreId;
  const activitats = await getActivitatsByCentreId(centreId);

  const centres = await getCentres();
  const userCentre = centres.find(c => c.id === centreId);
  const centreNom = userCentre ? userCentre.nom : "El teu Centre";

  return (
    <div>
      {/* Header section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "40px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "36px",
            color: "var(--verd-fosc)",
            margin: 0
          }}>
            Benvingut, {centreNom}
          </h1>
          <p style={{
            fontSize: "15px",
            color: "var(--muted)",
            marginTop: "6px",
            margin: 0
          }}>
            Aquí pots crear, editar o eliminar les activitats extraescolars que ofereix el teu centre.
          </p>
        </div>

        <Link
          href="/dashboard/activitats/nova"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "var(--verd)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "15px",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            boxShadow: "0 4px 12px rgba(26, 107, 58, 0.15)",
            transition: "all 0.2s"
          }}
          className="dashboard-primary-btn"
        >
          <Plus size={18} />
          Afegir Activitat
        </Link>
      </div>

      {/* Main activities view */}
      {activitats.length === 0 ? (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          border: "1px solid var(--verd-pallid)",
          padding: "60px 40px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(26, 107, 58, 0.02)",
          maxWidth: "600px",
          margin: "40px auto 0"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(26, 107, 58, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--verd)",
            margin: "0 auto 24px"
          }}>
            <Activity size={32} />
          </div>
          <h3 style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "24px",
            color: "var(--verd-fosc)",
            marginBottom: "12px"
          }}>
            Cap activitat publicada encara
          </h3>
          <p style={{
            fontSize: "15px",
            color: "var(--muted)",
            lineHeight: "1.6",
            marginBottom: "32px"
          }}>
            El teu centre encara no té cap activitat extraescolar registrada. Comença ara mateix afegint la primera activitat per fer-la visible a milers de famílies de Girona.
          </p>
          <Link
            href="/dashboard/activitats/nova"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--verd)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              transition: "all 0.2s"
            }}
            className="dashboard-primary-btn"
          >
            <Plus size={18} />
            Crea la teva primera activitat
          </Link>
        </div>
      ) : (
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          border: "1px solid var(--verd-pallid)",
          boxShadow: "0 10px 30px rgba(26, 107, 58, 0.02)",
          overflow: "hidden"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "15px"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "rgba(26, 107, 58, 0.02)",
                  borderBottom: "1px solid var(--verd-pallid)"
                }}>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)" }}>Nom de l'Activitat</th>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)" }}>Categoria</th>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)" }}>Barri</th>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)" }}>Edats</th>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)" }}>Preu</th>
                  <th style={{ padding: "20px 24px", fontWeight: 700, color: "var(--verd-fosc)", textAlign: "center" }}>Accions</th>
                </tr>
              </thead>
              <tbody>
                {activitats.map((act) => (
                  <tr
                    key={act.id}
                    style={{
                      borderBottom: "1px solid var(--crema-fosca)",
                      transition: "background-color 0.2s"
                    }}
                    className="dashboard-table-row"
                  >
                    {/* Nom */}
                    <td style={{ padding: "20px 24px", fontWeight: 600, color: "var(--verd-fosc)" }}>
                      <div>{act.nom}</div>
                      <div style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        fontWeight: 400,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "4px"
                      }}>
                        <Calendar size={12} /> {act.dies} • {act.horari}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td style={{ padding: "20px 24px", color: "var(--fosc)" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #dcfce7"
                      }}>
                        <Tag size={12} />
                        {act.categoria}
                      </span>
                    </td>

                    {/* Barri */}
                    <td style={{ padding: "20px 24px", color: "var(--fosc)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={14} style={{ color: "var(--verd)" }} />
                        {act.barri}
                      </span>
                    </td>

                    {/* Edats */}
                    <td style={{ padding: "20px 24px", color: "var(--muted)", fontWeight: 500 }}>
                      {act.edat}
                    </td>

                    {/* Preu */}
                    <td style={{ padding: "20px 24px", color: "var(--fosc)", fontWeight: 600 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CircleDollarSign size={14} style={{ color: "var(--verd)" }} />
                        {act.preu ? `${act.preu}€` : "N/A"}
                      </span>
                    </td>

                    {/* Accions */}
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        <Link
                          href={`/dashboard/activitats/${act.id}/editar`}
                          title="Editar activitat"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            border: "1px solid rgba(26, 107, 58, 0.15)",
                            color: "var(--verd)",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(26, 107, 58, 0.05)";
                            e.currentTarget.style.borderColor = "var(--verd)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.borderColor = "rgba(26, 107, 58, 0.15)";
                          }}
                        >
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
          <div style={{
            padding: "16px 24px",
            backgroundColor: "rgba(26, 107, 58, 0.01)",
            borderTop: "1px solid var(--crema-fosca)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "var(--muted)"
          }}>
            <Info size={14} style={{ color: "var(--verd)" }} />
            <span>Els canvis que realitzis es veuran reflectits de manera instantània a la pàgina web pública gràcies a la revalidació de memòria cau on-demand.</span>
          </div>
        </div>
      )}
    </div>
  );
}


