"use client";
import { useState } from "react";
import { welcomeText, whatsappLink } from "@/lib/credentials-text";
import type { Dict } from "@/lib/i18n";

/** بطاقة بيانات الدخول: نسخ + إرسال واتساب */
export default function CredentialsCard({ t, name, phone, email, password }: { t: Dict; name: string; phone: string; email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const text = welcomeText(t.admin.welcomeMsg, { name, brand: t.brand, url, email, password });

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
      <p className="text-sm font-semibold text-emerald-900">{t.admin.credsReady}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 font-sans text-sm leading-7 text-slate-800 ring-1 ring-emerald-100">{text}</pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn-navy">
          {copied ? t.admin.copied : t.admin.copyCreds}
        </button>
        <a href={whatsappLink(phone, text)} target="_blank" rel="noopener noreferrer" className="btn bg-emerald-600 text-white hover:bg-emerald-700">
          {t.admin.sendWhatsapp}
        </a>
      </div>
    </div>
  );
}
