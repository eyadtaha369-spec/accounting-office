"use client";
import { useState } from "react";
import DeleteButton from "@/components/ops/DeleteButton";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { usePages } from "@/components/store/SitePages";
import { addSitePage, deleteSitePage, reorderSitePages, updateSitePage } from "@/app/admin/site-actions";
import { PAGE_ICONS, pageIcon, type Row } from "@/lib/site";
import { parseServices } from "@/lib/services";
import { nowIso, patchById, removeById, replaceById } from "@/lib/view";

type Form = { title_ar: string; title_en: string; desc_ar: string; desc_en: string; icon: string; is_active: boolean; show_home: boolean };
const empty: Form = { title_ar: "", title_en: "", desc_ar: "", desc_en: "", icon: "briefcase", is_active: true, show_home: true };

export default function PagesManager() {
  const s = useAdmin();
  const { t } = useI18n();
  const pages = usePages();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const list = pages.all;
  const users = s.data?.Users ?? [];
  const usage = (k: string) => users.filter((u) => u.role === "client" && parseServices(u.services).includes(k)).length;

  function patch(id: string, p: Partial<Form>) {
    const row: Row = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "boolean" ? (v ? "yes" : "no") : String(v)]));
    void s.mutate({
      apply: (d) => ({ ...d, SitePages: patchById(d.SitePages, id, { ...row, updated_at: nowIso() }) }),
      run: () => updateSitePage(id, p),
      commit: (d, r) => (r.ok ? { ...d, SitePages: replaceById(d.SitePages, id, r.row) } : d),
      error: t.sync.saveFailed,
    });
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((p) => p.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void s.mutate({
      apply: (d) => ({ ...d, SitePages: d.SitePages.map((p) => ({ ...p, sort: String((ids.indexOf(p.id) + 1) * 10) })) }),
      run: () => reorderSitePages(ids),
      error: t.sync.saveFailed,
    });
  }

  function save(f: Form, id: string | null) {
    if (id) return patch(id, f);
    // المعرّف يُنشأ هنا ليكون نهائياً من أول لحظة (يمكن تفعيله لعميل فوراً)
    const nid = `p-${crypto.randomUUID().slice(0, 8)}`;
    const sort = String(((list.length ? Math.max(...list.map((p) => Number(p.sort) || 0)) : 0) + 10));
    const row: Row = { id: nid, ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "boolean" ? (v ? "yes" : "no") : v])), sort, created_at: nowIso(), updated_at: nowIso() };
    void s.mutate({
      apply: (d) => ({ ...d, SitePages: [...d.SitePages, row] }),
      run: () => addSitePage({ ...f, id: nid, sort }),
      commit: (d, r) => (r.ok ? { ...d, SitePages: replaceById(d.SitePages, nid, r.row) } : { ...d, SitePages: removeById(d.SitePages, nid) }),
      error: t.sync.saveFailed,
    });
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{t.site.pagesHint}</p>
        {editing !== "new" && <button onClick={() => setEditing("new")} className="btn-gold"><Icon name="plus" className="h-4 w-4" /> {t.site.addPage}</button>}
      </div>
      {editing === "new" && <PageForm init={empty} onCancel={() => setEditing(null)} onSave={(f) => { save(f, null); setEditing(null); }} />}

      {list.length === 0 && <p className="p-8 text-center text-sm text-slate-400">{t.site.noPages}</p>}
      <ul className="space-y-3">
        {list.map((p, i) => {
          const active = p.is_active !== "no";
          const home = p.show_home !== "no";
          if (editing === p.id)
            return (
              <li key={p.id}>
                <PageForm
                  init={{ title_ar: p.title_ar, title_en: p.title_en, desc_ar: p.desc_ar, desc_en: p.desc_en, icon: p.icon, is_active: active, show_home: home }}
                  onCancel={() => setEditing(null)}
                  onSave={(f) => { save(f, p.id); setEditing(null); }}
                />
              </li>
            );
          return (
            <li key={p.id} className={`flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 ${active ? "" : "opacity-60"}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-slate-400 hover:text-navy-800 disabled:opacity-30" aria-label={t.site.moveUp} title={t.site.moveUp}><Icon name="arrowUp" className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-0.5 text-slate-400 hover:text-navy-800 disabled:opacity-30" aria-label={t.site.moveDown} title={t.site.moveDown}><Icon name="arrowDown" className="h-4 w-4" /></button>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-900 text-gold-400"><Icon name={pageIcon(p)} className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-navy-900">{p.title_ar}{p.title_en && <span className="ms-2 inline-block text-xs font-normal text-slate-400" dir="ltr">{p.title_en}</span>}</div>
                {p.desc_ar && <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.desc_ar.split("\n").join(" · ")}</div>}
                <div className="mt-1 text-[11px] text-slate-400"><span className="ltr-num">{usage(p.id)}</span> {t.site.clientsUsing}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => patch(p.id, { is_active: !active })} className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`} title={active ? t.site.deactivate : t.site.activate}>
                  {active ? `● ${t.site.active}` : `○ ${t.site.inactive}`}
                </button>
                <button onClick={() => patch(p.id, { show_home: !home })} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${home ? "bg-gold-500/10 text-gold-700 ring-gold-400/40" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
                  <Icon name={home ? "eye" : "eyeOff"} className="h-3.5 w-3.5" /> {home ? t.site.showHome : t.site.hiddenHome}
                </button>
                <button onClick={() => setEditing(p.id)} className="btn-outline px-3 py-1.5 text-xs"><Icon name="edit" className="h-3.5 w-3.5" /> {t.site.editPage}</button>
                <span title={t.site.deleteHint}>
                  <DeleteButton onDelete={() => void s.mutate({ apply: (d) => ({ ...d, SitePages: removeById(d.SitePages, p.id) }), run: () => deleteSitePage(p.id), error: t.sync.saveFailed })} label={t.ops.delete} confirm={t.ops.confirmDelete} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-slate-400">{t.site.deleteHint}</p>
    </div>
  );
}

function PageForm({ init, onSave, onCancel }: { init: Form; onSave: (f: Form) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<Form>(init);
  const [err, setErr] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.title_ar.trim()) return setErr(true);
        onSave({ ...f, title_ar: f.title_ar.trim() });
      }}
      className="space-y-4 rounded-2xl bg-page p-4 ring-1 ring-gold-400/50 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t.site.pageTitle} <span className="text-red-500">*</span></label>
          <input autoFocus value={f.title_ar} onChange={(e) => { setF({ ...f, title_ar: e.target.value }); setErr(false); }} placeholder={t.site.pageTitlePh} className="input" maxLength={120} />
          {err && <p className="mt-1 text-xs text-red-600">{t.auth.errors.required}</p>}
        </div>
        <div>
          <label className="label">{t.site.pageTitleEn}</label>
          <input value={f.title_en} onChange={(e) => setF({ ...f, title_en: e.target.value })} className="input" dir="ltr" maxLength={120} />
        </div>
        <div>
          <label className="label">{t.site.pageDesc}</label>
          <textarea value={f.desc_ar} onChange={(e) => setF({ ...f, desc_ar: e.target.value })} rows={4} className="input" maxLength={1500} />
          <p className="mt-1 text-[11px] text-slate-400">{t.site.pageDescHint}</p>
        </div>
        <div>
          <label className="label">{t.site.pageDescEn}</label>
          <textarea value={f.desc_en} onChange={(e) => setF({ ...f, desc_en: e.target.value })} rows={4} className="input" dir="ltr" maxLength={1500} />
        </div>
      </div>
      <div>
        <label className="label">{t.site.icon}</label>
        <div className="flex flex-wrap gap-1.5">
          {PAGE_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setF({ ...f, icon: ic })}
              aria-pressed={f.icon === ic}
              className={`grid h-10 w-10 place-items-center rounded-lg ring-1 transition ${f.icon === ic ? "bg-navy-900 text-gold-400 ring-navy-900" : "bg-white text-slate-500 ring-slate-200 hover:ring-gold-400"}`}
            >
              <Icon name={ic} className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-5 text-sm text-slate-700">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="h-4 w-4 accent-emerald-600" /> {t.site.active}</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.show_home} onChange={(e) => setF({ ...f, show_home: e.target.checked })} className="h-4 w-4 accent-[#c7a45b]" /> {t.site.showHome}</label>
      </div>
      <div className="flex gap-2">
        <button className="btn-navy">{t.ops.save}</button>
        <button type="button" onClick={onCancel} className="btn-outline">{t.ops.cancel}</button>
      </div>
    </form>
  );
}
