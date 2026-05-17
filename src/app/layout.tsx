import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

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
  title: "GironaXics - Extraescolars a Girona",
  description: "Directori d'activitats extraescolars per a nens a Girona.",
  openGraph: {
    title: "GironaXics - Extraescolars a Girona",
    description: "Directori d'activitats extraescolars per a nens a Girona.",
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'GironaXics - Extraescolars a Girona',
      },
    ],
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
      <body>
        {children}
        <GoogleAnalytics gaId="G-HLLM705LRK" />
      </body>
    </html>
  );
}