import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/pwa/PwaRegister";
import "./globals.css";
import { getDict } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return {
    title: `${t.brand} | ${t.brandTag}`,
    description: t.hero.subtitle,
    applicationName: "مكتب محمد عبدالعال",
    // iPhone: تشغيل كتطبيق مستقل + اسم وأيقونة الشاشة الرئيسية
    appleWebApp: { capable: true, title: "مكتب محمد عبدالعال", statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
    icons: {
      icon: [
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    other: { "mobile-web-app-capable": "yes", "apple-mobile-web-app-capable": "yes" },
  };
}

export const viewport: Viewport = {
  themeColor: "#14243b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getDict();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        {/* التقاط حدث التثبيت مبكراً قبل تحميل React */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;window.dispatchEvent(new Event('bip-ready'))});",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
