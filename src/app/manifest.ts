import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PisoPro",
    short_name: "PisoPro",
    description:
      "Gestión inteligente de tareas, gastos y convivencia en pisos compartidos",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFBFC",
    theme_color: "#31405F",
    orientation: "portrait",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
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
