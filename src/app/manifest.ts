import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "PCT24X7",
    description: siteConfig.description,
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f7fd",
    theme_color: "#1f5fb5",
    icons: [
      {
        src: "/icons/pct-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/pct-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/pct-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["health", "shopping"],
    shortcuts: [
      {
        name: "Browse the catalog",
        short_name: "Catalog",
        url: "/#catalog",
        icons: [
          {
            src: "/icons/pct-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  }
}
