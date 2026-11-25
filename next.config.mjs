/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
    // صفحات اللوحات خفيفة (البيانات من ذاكرة المتصفح) — نحتفظ بها في الراوتر للتنقل الفوري
    staleTimes: { dynamic: 300, static: 300 },
  },
};
export default nextConfig;
