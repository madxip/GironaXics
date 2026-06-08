"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useState } from "react";

const GA_ID = "G-HLLM705LRK";

export default function GoogleAnalytics() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Llegim el consentiment inicial
    const stored = localStorage.getItem("gironaxics-analytics-consent");
    if (stored === "true") setConsent(true);
    if (stored === "false") setConsent(false);

    // Escoltem si l'usuari accepta/rebutja des del CookieBanner
    const handleConsent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConsent(detail === "true");
    };
    window.addEventListener("gironaxics-consent-changed", handleConsent);
    return () => window.removeEventListener("gironaxics-consent-changed", handleConsent);
  }, []);

  // No renderitzem res fins saber el consentiment, o si ha rebutjat
  if (!consent) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
