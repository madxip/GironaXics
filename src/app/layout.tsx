import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
  title: {
    default: "GironaXics - Extraescolars, casals i activitats a Girona",
    template: "%s | GironaXics",
  },
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
    siteName: 'GironaXics',
    title: "GironaXics - Extraescolars, casals i activitats a Girona",
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
        <link rel="preconnect" href="https://fgghipujyartbzumtmzv.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fgghipujyartbzumtmzv.supabase.co" />
      </head>
      <body>
        {children}
        <AnalyticsTracker />
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}