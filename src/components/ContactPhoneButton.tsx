"use client";

import { trackEvent } from "@/lib/trackEvent";

interface ContactPhoneButtonProps {
  telefon: string;
  activitatNom: string;
  activitatId?: string;
}

export default function ContactPhoneButton({
  telefon,
  activitatNom,
  activitatId,
}: ContactPhoneButtonProps) {
  return (
    <a
      href={`tel:${telefon}`}
      className="hoverable"
      style={{
        display: "block",
        backgroundColor: "var(--verd-fosc)",
        color: "white",
        padding: "16px",
        textAlign: "center",
        borderRadius: "4px",
        textDecoration: "none",
        fontWeight: 700,
      }}
      onClick={() => trackEvent("contact_phone", activitatNom, telefon, activitatId)}
    >
      📞 {telefon}
    </a>
  );
}
