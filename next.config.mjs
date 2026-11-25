/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
    // صفحات اللوحات خفيفة (البيانات من ذاكرة المتصفح) — نحتفظ بها في الراوتر للتنقل الفوري
    staleTimes: { dynamic: 300, static: 300 },
  },
  // ملف الـ Service Worker يجب ألا يُخزَّن حتى تصل التحديثات فوراً
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};
export default nextConfig;
