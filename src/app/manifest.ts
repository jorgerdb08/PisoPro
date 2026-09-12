import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PisoPro - Gestión de Convivencia",
    short_name: "PisoPro",
    description:
      "Aplicación para organizar tareas, gastos y convivencia en pisos compartidos",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#059669",
    orientation: "portrait",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tareas",
        short_name: "Tareas",
        description: "Ver y completar tareas del hogar",
        url: "/tareas",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Gastos",
        short_name: "Gastos",
        description: "Balances compartidos y registro de tickets",
        url: "/gastos",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Compra",
        short_name: "Compra",
        description: "Lista de la compra compartida en tiempo real",
        url: "/compra",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Chat",
        short_name: "Chat",
        description: "Canal y avisos entre compañeros de piso",
        url: "/chat",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
