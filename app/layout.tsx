import type { Metadata } from "next";
import "./globals.css";
import { getDict } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: `${t.brand} | ${t.brandTag}`, description: t.hero.subtitle };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getDict();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
