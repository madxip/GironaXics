"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";

interface TrackActivityViewProps {
  activitatId: string;
  activitatNom: string;
}

export default function TrackActivityView({ activitatId, activitatNom }: TrackActivityViewProps) {
  useEffect(() => {
    if (activitatId && activitatNom) {
      // Guarda la visita a nivell intern d'Airtable (independentment de les cookies de GA)
      trackEvent("activity_view", activitatNom, undefined, activitatId);
    }
  }, [activitatId, activitatNom]);

  return null;
}
