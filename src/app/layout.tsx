import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Conseil-Orientation-Travel";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteName} — Études à l'étranger depuis le Sénégal`, template: `%s | ${siteName}` },
  description:
    "Plateforme d'orientation, de conseil et d'accompagnement aux études à l'étranger : France, Belgique, Luxembourg, Italie, Maroc.",
  openGraph: { type: "website", siteName, locale: "fr_SN" },
  alternates: { canonical: "/" },
  appleWebApp: { capable: true, title: "COT", statusBarStyle: "black-translucent" },
};

/** Couleur de la barre du navigateur, et affichage sous les encoches (les barres fixes gèrent les zones de sécurité). */
export const viewport: Viewport = { themeColor: "#063B70", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
