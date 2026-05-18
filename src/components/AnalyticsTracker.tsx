"use client";

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function AnalyticsTracker() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gironaxics-analytics-consent');
    if (stored === 'true') {
      setConsent(true);
    } else if (stored === 'false') {
      setConsent(false);
    } else {
      setConsent(null);
    }

    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setConsent(customEvent.detail === 'true');
    };
    window.addEventListener('gironaxics-consent-changed', handleConsentChange);
    return () => window.removeEventListener('gironaxics-consent-changed', handleConsentChange);
  }, []);

  if (consent !== true) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
