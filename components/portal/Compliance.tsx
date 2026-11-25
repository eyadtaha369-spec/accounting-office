"use client";
import { useState } from "react";
import { useI18n, useMe } from "@/components/store/I18n";
import PoaDialog from "./PoaDialog";
import { useAdmin } from "@/components/store/stores";
import { updateCompliance } from "@/app/portal-actions";
import { patchById } from "@/lib/view";
import { AdminVault } from "./Vault";
import type { R } from "@/lib/store-types";

/** تواريخ انتهاء السجل/البطاقة + بيانات التوكيل (الأدمن) */
export default function Compliance({ client }: { client: R }) {
  const s = useAdmin();
  const { t } = useI18n();
  const me = useMe();
  const [poaOpen, setPoaOpen] = useState(false);
  const p = t.portal;
  const [f, setF] = useState({
    cr_expiry: client.cr_expiry ?? "",
    tax_card_expiry: client.tax_card_expiry ?? "",
    poa_has: client.poa_has ?? "",
    poa_number: client.poa_number ?? "",
    poa_letter_year: client.poa_letter_year ?? "",
    poa_office: client.poa_office ?? "",
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f, v: string) => {
    setSaved(false);
    setF((x) => ({ ...x, [k]: v }));
  };
  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    void s.mutate({ apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, f) }), run: () => updateCompliance(client.id, f), error: t.sync.saveFailed });
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        <button type="button" onClick={() => setPoaOpen(true)} className="btn-gold">📜 {t.poaT.openPoa}</button>
        {me.role === "admin" && (
          <a href="/admin/settings#poa" className="text-xs text-slate-500 underline hover:text-navy-800">✏ {t.poaT.tab}</a>
        )}
      </div>
      {poaOpen && (
        <PoaDialog
          settings={s.data?.SiteSettings ?? []}
          client={client}
          kinds={["client", "accountant"]}
          title={`${t.poaT.openPoa} — ${client.full_name}`}
          hint={t.poaT.placeholdersHint}
          onClose={() => setPoaOpen(false)}
        />
      )}
      <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{p.crExpiry}</label>
          <input type="date" value={f.cr_expiry} onChange={(e) => set("cr_expiry", e.target.value)} className="input" dir="ltr" />
        </div>
        <div>
          <label className="label">{p.taxCardExpiry}</label>
          <input type="date" value={f.tax_card_expiry} onChange={(e) => set("tax_card_expiry", e.target.value)} className="input" dir="ltr" />
        </div>
        <div>
          <label className="label">{p.poaHas}</label>
          <div className="flex gap-2">
            {(["yes", "no"] as const).map((v) => (
              <button type="button" key={v} onClick={() => set("poa_has", v)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold ring-1 ${f.poa_has === v ? (v === "yes" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-red-600 text-white ring-red-600") : "bg-white text-slate-600 ring-slate-200"}`}>
                {p[v]}
              </button>
            ))}
          </div>
        </div>
        {f.poa_has === "yes" && (
          <>
            <div>
              <label className="label">{p.poaNumber}</label>
              <input value={f.poa_number} onChange={(e) => set("poa_number", e.target.value)} className="input" dir="ltr" />
            </div>
            <div>
              <label className="label">{p.poaLetterYear}</label>
              <input value={f.poa_letter_year} onChange={(e) => set("poa_letter_year", e.target.value)} placeholder="أ / 2026" className="input" />
            </div>
            <div>
              <label className="label">{p.poaOffice}</label>
              <input value={f.poa_office} onChange={(e) => set("poa_office", e.target.value)} className="input" />
            </div>
          </>
        )}
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <button className="btn-navy">{t.ops.save}</button>
          {saved && <span className="text-sm text-emerald-700">{t.ops.saved}</span>}
        </div>
      </form>
      {f.poa_has === "yes" && (
        <div className="border-t border-slate-100">
          <AdminVault client={client} keys={["poa"]} />
        </div>
      )}
    </div>
  );
}
