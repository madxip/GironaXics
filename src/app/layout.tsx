import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
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
      </body>
    </html>
  );
}
