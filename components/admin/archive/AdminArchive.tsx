"use client";
import { useMemo, useState } from "react";
import AddDocForm from "./AddDocForm";
import EyeToggle from "./EyeToggle";
import DeleteButton from "@/components/ops/DeleteButton";
import { Icon } from "@/components/Icons";
import { openDriveFile } from "@/components/portal/openFile";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { usePages } from "@/components/store/SitePages";
import { deleteArchiveDoc, setDocVisibility, setYearVisibility } from "@/app/archive-actions";
import { fmtDate } from "@/lib/format";
import { isTmp, patchById, removeById } from "@/lib/view";
import type { R } from "@/lib/store-types";

const FIRST_YEAR = 2020;

/** سنوات العميل: 2020 → السنة الحالية + أي سنة مضافة أو بها مستندات */
export function clientYears(years: R[], docs: R[]) {
  const now = new Date().getFullYear();
  const set = new Set<string>();
  for (let y = FIRST_YEAR; y <= now; y++) set.add(String(y));
  years.forEach((y) => set.add(y.year));
  docs.forEach((d) => set.add(d.year));
  return [...set].sort().reverse();
}

/** هوك مشترك لعمليات الإظهار/الإخفاء والحذف (تحديث فوري + حفظ في الخلفية) */
export function useArchiveOps(clientId: string) {
  const s = useAdmin();
  const { t } = useI18n();
  return {
    toggleYear(year: string, visible: boolean) {
      const id = `${clientId}:${year}`;
      void s.mutate({
        apply: (d) => {
          const exists = d.ArchiveYears.some((y) => y.id === id);
          return { ...d, ArchiveYears: exists ? patchById(d.ArchiveYears, id, { is_visible: visible ? "yes" : "no" }) : [...d.ArchiveYears, { id, client_id: clientId, year, is_visible: visible ? "yes" : "no" }] };
        },
        run: () => setYearVisibility(clientId, year, visible),
        error: t.sync.saveFailed,
      });
    },
    toggleDoc(doc: R) {
      const visible = doc.is_visible === "no";
      void s.mutate({
        apply: (d) => ({ ...d, ArchiveDocs: patchById(d.ArchiveDocs, doc.id, { is_visible: visible ? "yes" : "no" }) }),
        run: () => setDocVisibility(doc.id, visible),
        error: t.sync.saveFailed,
      });
    },
    remove(doc: R) {
      void s.mutate({ apply: (d) => ({ ...d, ArchiveDocs: removeById(d.ArchiveDocs, doc.id) }), run: () => deleteArchiveDoc(doc.id), error: t.sync.saveFailed });
    },
  };
}

/** صف مستند في الأرشيف (للإدارة) */
export function DocRow({ doc, clientId, showSection = true }: { doc: R; clientId: string; showSection?: boolean }) {
  const s = useAdmin();
  const { t, locale } = useI18n();
  const ops = useArchiveOps(clientId);
  const pages = usePages();
  const pending = isTmp(doc.id);
  const on = doc.is_visible !== "no";
  return (
    <li className={`flex flex-wrap items-center gap-3 px-4 py-3 ${pending ? "opacity-60" : ""}`}>
      <Icon name={doc.mime_type === "application/pdf" ? "file" : doc.link ? "external" : "file"} className="h-5 w-5 text-gold-600" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-800">{doc.title}</div>
        <div className="text-xs text-slate-400">
          {showSection && <span className="me-2 rounded bg-page px-1.5 py-0.5 text-slate-500">{pages.label(doc.section)}</span>}
          {pending ? t.arch.saving : fmtDate(doc.created_at, locale)}
        </div>
      </div>
      <EyeToggle on={on} onToggle={() => ops.toggleDoc(doc)} disabled={pending} />
      {!pending && (
        <>
          <button onClick={() => (doc.link ? window.open(doc.link, "_blank", "noopener") : openDriveFile(s.url, s.ticket(doc.drive_file_id)))} className="btn-outline px-3 py-1.5 text-xs">
            <Icon name="download" className="h-3.5 w-3.5" /> {t.dash.download}
          </button>
          <DeleteButton onDelete={() => ops.remove(doc)} label={t.ops.delete} confirm={t.ops.confirmDelete} />
        </>
      )}
    </li>
  );
}

/** الأرشيف السنوي للمستندات — مجلد لكل سنة مع التحكم في الظهور */
export default function AdminArchive({ clientId }: { clientId: string }) {
  const s = useAdmin();
  const { t } = useI18n();
  const ops = useArchiveOps(clientId);
  const yearsRows = useMemo(() => (s.data?.ArchiveYears ?? []).filter((y) => y.client_id === clientId), [s.data, clientId]);
  const docs = useMemo(() => (s.data?.ArchiveDocs ?? []).filter((d) => d.client_id === clientId), [s.data, clientId]);
  const [extra, setExtra] = useState<string[]>([]);
  const years = useMemo(() => [...new Set([...extra, ...clientYears(yearsRows, docs)])].sort().reverse(), [extra, yearsRows, docs]);
  const [open, setOpen] = useState<string | null>(String(new Date().getFullYear()));
  const [adding, setAdding] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(false);
  const [ny, setNy] = useState("");

  const yearVisible = (y: string) => yearsRows.find((r) => r.year === y)?.is_visible !== "no";

  function addYear(e: React.FormEvent) {
    e.preventDefault();
    if (!/^(19|20)\d{2}$/.test(ny)) return;
    setExtra((x) => [...new Set([...x, ny])]);
    ops.toggleYear(ny, true);
    setOpen(ny);
    setNy("");
    setNewYear(false);
  }

  return (
    <div className="space-y-3 p-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setAdding(open ?? years[0])} className="btn-gold"><Icon name="camera" className="h-4 w-4" /> {t.arch.addDoc}</button>
        {newYear ? (
          <form onSubmit={addYear} className="flex gap-2">
            <input autoFocus value={ny} onChange={(e) => setNy(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2027" className="input w-28 ltr-num" inputMode="numeric" />
            <button className="btn-navy">✓</button>
            <button type="button" onClick={() => setNewYear(false)} className="btn-outline">{t.ops.cancel}</button>
          </form>
        ) : (
          <button onClick={() => setNewYear(true)} className="btn-outline"><Icon name="folderPlus" className="h-4 w-4" /> {t.arch.addYear}</button>
        )}
      </div>

      {adding && <AddDocForm clientId={clientId} years={years} year={adding} section="general" onDone={() => setAdding(null)} />}

      {years.map((y) => {
        const list = docs.filter((d) => d.year === y).sort((a, b) => b.created_at.localeCompare(a.created_at));
        const vis = yearVisible(y);
        const shown = list.filter((d) => d.is_visible !== "no").length;
        const isOpen = open === y;
        return (
          <div key={y} className={`overflow-hidden rounded-xl ring-1 ${vis ? "ring-slate-200" : "ring-slate-200 opacity-80"}`}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(isOpen ? null : y)}
              onKeyDown={(e) => e.key === "Enter" && setOpen(isOpen ? null : y)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${isOpen ? "bg-navy-900 text-white" : "bg-white hover:bg-page"}`}
            >
              <span className={`text-2xl ${vis ? "" : "grayscale"}`}>{isOpen ? "📂" : "📁"}</span>
              <span className="ltr-num text-lg font-bold">{y}</span>
              <span className={`flex-1 text-xs ${isOpen ? "text-gold-300" : "text-slate-500"}`}>
                {list.length} {t.arch.docs}{list.length ? ` · 👁️ ${shown}` : ""}
              </span>
              <EyeToggle on={vis} onToggle={() => ops.toggleYear(y, !vis)} />
            </div>
            {isOpen && (
              <div className="bg-white">
                {list.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-400">{t.arch.empty}</p>
                ) : (
                  <ul className="divide-y divide-slate-100">{list.map((d) => <DocRow key={d.id} doc={d} clientId={clientId} />)}</ul>
                )}
                <div className="border-t border-slate-100 p-3">
                  <button onClick={() => setAdding(y)} className="btn-outline text-xs"><Icon name="plus" className="h-3.5 w-3.5" /> {t.arch.addDoc} — {y}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
