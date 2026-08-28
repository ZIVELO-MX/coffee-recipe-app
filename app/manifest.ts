import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Koda Brew — Recetas de café",
    short_name: "Koda Brew",
    description: "Descubre, guarda y prepara recetas de café paso a paso.",
    start_url: "/recipes",
    scope: "/",
    lang: "es-MX",
    display: "standalone",
    orientation: "portrait-primary",
    categories: ["food", "lifestyle", "utilities"],
    background_color: "#1a1712",
    theme_color: "#1a1712",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buscar recetas", short_name: "Buscar", url: "/recipes", icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }] },
      { name: "Recetas guardadas", short_name: "Guardados", url: "/saved", icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }] },
      { name: "Mi perfil", short_name: "Perfil", url: "/profile", icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }] },
    ],
  }
}
