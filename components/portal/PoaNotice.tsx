"use client";
import { useState } from "react";
import { useI18n } from "@/components/store/I18n";
import { poaTemplate } from "@/lib/poa";

/** تنبيه التوكيل + نافذة الصيغة الجاهزة مع زر النسخ */
export default function PoaNotice() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = poaTemplate();
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <span className="text-2xl">📜</span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-7 text-amber-900">{t.portal.poaAlert}</p>
        <button type="button" onClick={() => setOpen(true)} className="btn-navy">{t.portal.poaShow}</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="font-bold text-navy-900">{t.portal.poaModalTitle}</h3>
              <p className="mt-1 text-xs text-slate-500">{t.portal.poaModalHint}</p>
            </div>
            <pre className="flex-1 overflow-y-auto whitespace-pre-wrap p-5 font-sans text-sm leading-8 text-slate-800" dir="rtl">{text}</pre>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn-gold"
              >
                {copied ? t.portal.copied : t.portal.copy}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="btn-outline">{t.portal.close}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
