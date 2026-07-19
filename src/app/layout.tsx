import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gironaxics.cat'),
  title: "GironaXics - Extraescolars a Girona (Gi)",
  description: "El directori d'extraescolars, tallers, casals i activitats de les comarques gironines.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "GironaXics - Extraescolars a Girona",
    description: "El directori d'extraescolars, tallers, casals i activitats de les comarques gironines.",
    locale: 'ca_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        {/* Proposta 5: preconnect Airtable CDN per reduir latència de connexió */}
        <link rel="preconnect" href="https://v5.airtableusercontent.com" />
        <link rel="dns-prefetch" href="https://v5.airtableusercontent.com" />
      </head>
      <body>
        {children}
        <AnalyticsTracker />
        <Analytics />
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}