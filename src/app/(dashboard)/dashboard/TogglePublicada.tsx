"use client";

import React, { useState, useTransition } from "react";
import { togglePublicadaAction } from "@/app/actions/activitats";
import { useRouter } from "next/navigation";

interface TogglePublicadaProps {
  id: string;
  initialPublicada: boolean;
}

export default function TogglePublicada({ id, initialPublicada }: TogglePublicadaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [publicada, setPublicada] = useState(initialPublicada);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    
    // Canvi d'estat visual de manera optimista
    setPublicada(newValue);

    startTransition(async () => {
      try {
        const res = await togglePublicadaAction(id, newValue);
        if (res && !res.success) {
          // Si falla, revertim l'estat optimista i avisem l'usuari
          setPublicada(!newValue);
          alert(res.error || "No s'ha pogut canviar l'estat de publicació.");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("[Toggle Publicada Error]", err);
        setPublicada(!newValue);
        alert("S'ha produït un error de connexió. Torna-ho a provar.");
      }
    });
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px"
    }}>
      <label className="switch" title={publicada ? "Publicada (visible a la web)" : "Oculta (borrador)"}>
        <input
          type="checkbox"
          checked={publicada}
          onChange={handleToggle}
          disabled={isPending}
        />
        <span className={`slider ${isPending ? 'disabled' : ''}`}></span>
      </label>
      
      <span style={{
        fontSize: "12px",
        fontWeight: 600,
        minWidth: "65px",
        textAlign: "left",
        color: publicada ? "var(--verd)" : "var(--muted)",
        transition: "color 0.2s"
      }}>
        {publicada ? "Publicada" : "Oculta"}
      </span>
    </div>
  );
}
