import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Koda Brew — Recetas de café",
    short_name: "Koda Brew",
    description: "Descubre, guarda y prepara recetas de café paso a paso.",
    start_url: "/recipes",
    scope: "/",
    display: "standalone",
    background_color: "#1a1712",
    theme_color: "#1a1712",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
