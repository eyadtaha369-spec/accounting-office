"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/components/store/I18n";
import { fillPoa, poaTemplateOf, type PoaKind } from "@/lib/poa";
import { officeWhatsApp } from "@/lib/contact";
import type { Row } from "@/lib/site";

const ACC_KEY = "poa-accountant";

/** نافذة صيغ التوكيل: تقرأ آخر نسخة محفوظة وتستبدل المتغيرات ببيانات العميل */
export default function PoaDialog({ settings, client, kinds, onClose, title, hint }: {
  settings: Row[]; client: Row | null; kinds: PoaKind[]; onClose: () => void; title: string; hint?: string;
}) {
  const { t } = useI18n();
  const [kind, setKind] = useState<PoaKind>(kinds[0]);
  const [acc, setAcc] = useState({ name: "", nid: "" });
  const [copied, setCopied] = useState<PoaKind | null>(null);

  // بيانات المحاسب تُحفظ على هذا الجهاز فقط لتسهيل الاستخدام المتكرر
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(ACC_KEY) || "null"); if (v) setAcc(v); } catch {}
  }, []);
  const setA = (v: typeof acc) => { setAcc(v); try { localStorage.setItem(ACC_KEY, JSON.stringify(v)); } catch {} };

  const text = (k: PoaKind) => fillPoa(poaTemplateOf(settings, k), { settings, client, accountant: acc });
  async function copy(k: PoaKind) {
    await navigator.clipboard.writeText(text(k));
    setCopied(k);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-4" onClick={onClose} role="dialog" aria-modal>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <span className="text-2xl">📜</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-navy-900">{title}</h3>
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-page" aria-label={t.portal.close}><Icon name="close" className="h-5 w-5" /></button>
        </div>
        {kinds.length > 1 && (
          <div className="flex gap-1.5 border-b border-slate-100 px-5 py-3">
            {kinds.map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 ${kind === k ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200"}`}>
                {k === "client" ? t.poaT.clientTitle : t.poaT.accountantTitle}
              </button>
            ))}
          </div>
        )}
        {kind === "accountant" && (
          <div className="grid gap-2 border-b border-slate-100 bg-page/60 px-5 py-3 sm:grid-cols-2">
            <input value={acc.name} onChange={(e) => setA({ ...acc, name: e.target.value })} placeholder={t.poaT.accountantName} className="input" />
            <input value={acc.nid} onChange={(e) => setA({ ...acc, nid: e.target.value.replace(/\D/g, "").slice(0, 14) })} placeholder={t.poaT.accountantNid} className="input ltr-num" inputMode="numeric" />
          </div>
        )}
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap p-5 font-sans text-sm leading-8 text-slate-800" dir="rtl">{text(kind)}</pre>
        <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
          {kinds.map((k) => (
            <button key={k} type="button" onClick={() => copy(k)} className={k === "client" ? "btn-gold" : "btn-navy"}>
              <Icon name={copied === k ? "check" : "file"} className="h-4 w-4" />
              {copied === k ? t.poaT.copied : kinds.length > 1 ? (k === "client" ? t.poaT.copyClient : t.poaT.copyAccountant) : t.portal.copy}
            </button>
          ))}
          {client?.phone && kinds.length > 1 && (
            <a href={officeWhatsApp(client.phone, text("client"))} target="_blank" rel="noopener noreferrer" className="btn bg-emerald-600 text-white hover:bg-emerald-700">
              <Icon name="chat" className="h-4 w-4" /> {t.poaT.sendWa}
            </a>
          )}
          <button type="button" onClick={onClose} className="btn-outline">{t.portal.close}</button>
        </div>
      </div>
    </div>
  );
}
