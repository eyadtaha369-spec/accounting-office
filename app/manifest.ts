import type { MetadataRoute } from "next";

// يُخدم على /manifest.webmanifest ويُربط تلقائياً في <head>
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "مكتب محمد عبدالعال محمد للمحاسبة والمراجعة",
    short_name: "مكتب محمد عبدالعال",
    description: "بوابة مكتب محمد عبدالعال محمد للمحاسبة والمراجعة — متابعة الملفات والإقرارات والمستندات",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#14243b",
    theme_color: "#14243b",
    lang: "ar",
    dir: "rtl",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "حسابي", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "لوحة الإدارة", url: "/admin", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
