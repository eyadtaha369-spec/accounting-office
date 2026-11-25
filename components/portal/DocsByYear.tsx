"use client";
import { useState } from "react";
import { useI18n } from "@/components/store/I18n";
import { Icon } from "@/components/Icons";
import { openDriveFile } from "./openFile";
import { fmtDate } from "@/lib/format";
import type { R } from "@/lib/store-types";

/** عرض مستندات (للعميل: قراءة وتحميل فقط) مجمعة بالسنوات */
export default function DocsByYear({ docs, url, ticket, showSection = false }: { docs: R[]; url: string; ticket: (id: string) => string; showSection?: boolean }) {
  const { t, locale } = useI18n();
  const years = [...new Set(docs.map((d) => d.year))].sort().reverse();
  const [open, setOpen] = useState<string | null>(years[0] ?? null);
  if (!docs.length) return <p className="p-10 text-center text-sm text-slate-500">{t.arch.noDocsClient}</p>;
  return (
    <div className="space-y-3 p-5">
      {years.map((y) => {
        const list = docs.filter((d) => d.year === y).sort((a, b) => b.created_at.localeCompare(a.created_at));
        const isOpen = open === y;
        return (
          <div key={y} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
            <button onClick={() => setOpen(isOpen ? null : y)} className={`flex w-full items-center gap-3 px-4 py-3 text-start ${isOpen ? "bg-navy-900 text-white" : "bg-white hover:bg-page"}`}>
              <span className={`text-2xl ${isOpen ? "" : "grayscale-[30%]"}`}>{isOpen ? "📂" : "📁"}</span>
              <span className="ltr-num flex-1 text-lg font-bold">{y}</span>
              <span className={`text-xs ${isOpen ? "text-gold-300" : "text-slate-500"}`}>{list.length} {t.arch.docs}</span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-slate-100 bg-white">
                {list.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Icon name={d.link ? "external" : "file"} className="h-5 w-5 text-gold-600" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-800">{d.title}</div>
                      <div className="text-xs text-slate-400">
                        {showSection && <span className="me-2 rounded bg-page px-1.5 py-0.5 text-slate-500">{t.arch.svc[(d.section || "general") as keyof typeof t.arch.svc]}</span>}
                        {fmtDate(d.created_at, locale)}
                      </div>
                    </div>
                    <button
                      onClick={() => (d.link ? window.open(d.link, "_blank", "noopener") : openDriveFile(url, ticket(d.drive_file_id)))}
                      className="btn-outline px-3 py-1.5 text-xs"
                    >
                      <Icon name="download" className="h-3.5 w-3.5" /> {t.dash.download}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
