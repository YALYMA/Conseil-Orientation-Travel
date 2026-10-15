import type { MetadataRoute } from "next";

/** Rend le site installable sur l'écran d'accueil (Android, iOS, ordinateur) : ouverture plein écran, sans barre d'adresse. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conseil-Orientation-Travel",
    short_name: "COT",
    description: "Orientation, conseil et accompagnement aux études à l'étranger.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F8FB",
    theme_color: "#063B70",
    lang: "fr",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Test d'orientation", url: "/orientation" },
      { name: "Mon espace", url: "/app/dashboard" },
    ],
  };
}
