"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteActivitatAction } from "@/app/actions/activitats";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
  nom: string;
}

export default function DeleteButton({ id, nom }: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Estàs segur que vols eliminar l'activitat "${nom}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteActivitatAction(id);
      if (res && !res.success) {
        alert(res.error || "No s'ha pogut eliminar l'activitat.");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("[Delete Error]", err);
      alert("S'ha produït un error de xarxa. Torna-ho a provar.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Eliminar activitat"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        borderRadius: "6px",
        backgroundColor: "transparent",
        border: "1px solid rgba(220, 53, 69, 0.15)",
        color: "#dc3545",
        cursor: deleting ? "not-allowed" : "pointer",
        transition: "all 0.2s"
      }}
      onMouseOver={(e) => {
        if (!deleting) {
          e.currentTarget.style.backgroundColor = "#fff5f5";
          e.currentTarget.style.borderColor = "#dc3545";
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "rgba(220, 53, 69, 0.15)";
      }}
    >
      <Trash2 size={16} />
    </button>
  );
}
