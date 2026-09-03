import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Lista",
    short_name: "La Lista",
    description: "Tu lista de compras y comparativa de precios de supermercados",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#C27BFF",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}