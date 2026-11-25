"use client";
import { useState } from "react";
import ServiceChecks from "../ServiceChecks";
import PortalCard from "../client/PortalCard";
import AddDocForm from "./AddDocForm";
import { DocRow, clientYears } from "./AdminArchive";
import { Panel } from "@/components/ops/Panel";
import { Icon } from "@/components/Icons";
import { SERVICE_ICON } from "@/components/portal/serviceIcons";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { setClientServices } from "@/app/archive-actions";
import { parseServices, serializeServices, type ClientService } from "@/lib/services";
import { PORTAL_URLS } from "@/lib/i18n";
import { patchById, replaceById } from "@/lib/view";
import type { R } from "@/lib/store-types";

/** البوابة الحكومية لكل خدمة */
const PORTAL_OF: Partial<Record<ClientService, "tax_portal" | "e_invoice">> = {
  einvoice: "e_invoice", income: "tax_portal", vat: "tax_portal", payroll: "tax_portal",
};
/** الأقسام التي بها زر "رفع وتحميل الإقرار / الفواتير" مميز */
const RETURN_SECTIONS: ClientService[] = ["einvoice", "income", "vat"];

export default function ServicesTab({ client, savedPortals }: { client: R; savedPortals: Set<string> }) {
  const s = useAdmin();
  const me = useMe();
  const { t } = useI18n();
  const isAdmin = me.role === "admin";
  const enabled = parseServices(client.services);
  const docs = (s.data?.ArchiveDocs ?? []).filter((d) => d.client_id === client.id);
  const years = clientYears((s.data?.ArchiveYears ?? []).filter((y) => y.client_id === client.id), docs);
  const [adding, setAdding] = useState<ClientService | null>(null);

  function setServices(list: string[]) {
    const services = serializeServices(list);
    void s.mutate({
      apply: (d) => ({ ...d, Users: patchById(d.Users, client.id, { services }) }),
      run: () => setClientServices(client.id, list),
      commit: (d, r) => (r.ok ? { ...d, Users: replaceById(d.Users, client.id, r.user) } : d),
      error: t.sync.saveFailed,
    });
  }

  return (
    <div className="space-y-6">
      <Panel title={`⚙️ ${t.arch.servicesTitle}`} hint={t.arch.servicesHint}>
        <div className="p-5"><ServiceChecks t={t} value={enabled} onChange={setServices} /></div>
      </Panel>

      {enabled.length === 0 && <p className="card p-8 text-center text-sm text-slate-500">{t.arch.noServices}</p>}

      {enabled.map((k) => {
        const portal = PORTAL_OF[k];
        const list = docs.filter((d) => d.section === k).sort((a, b) => b.year.localeCompare(a.year) || b.created_at.localeCompare(a.created_at));
        const byYear = [...new Set(list.map((d) => d.year))];
        return (
          <section key={k} className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-gold-400"><Icon name={SERVICE_ICON[k]} className="h-5 w-5" /></div>
              <h2 className="flex-1 font-bold text-navy-900">{t.arch.svc[k]}</h2>
              {portal && (
                <a href={PORTAL_URLS[portal]} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                  <Icon name="external" className="h-4 w-4" /> {t.arch.portalLinks}
                </a>
              )}
              <button onClick={() => setAdding(adding === k ? null : k)} className="btn-gold text-sm">
                <Icon name="upload" className="h-4 w-4" /> {RETURN_SECTIONS.includes(k) ? t.arch.uploadReturn : t.arch.addDoc}
              </button>
            </div>
            {portal && (k === "einvoice" || k === "income") && (
              <div className="border-b border-slate-100 bg-page/60 p-4">
                <PortalCard t={t} clientId={client.id} portal={portal} title={portal === "e_invoice" ? t.admin.portalEinvoice : t.admin.portalTax} url={PORTAL_URLS[portal]} saved={savedPortals.has(portal)} canManage={isAdmin} />
              </div>
            )}
            {adding === k && (
              <div className="border-b border-slate-100 p-4">
                <AddDocForm clientId={client.id} years={years} year={String(new Date().getFullYear())} section={k} lockSection onDone={() => setAdding(null)} />
              </div>
            )}
            {list.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">{t.arch.empty}</p>
            ) : (
              byYear.map((y) => (
                <div key={y}>
                  <div className="ltr-num bg-page px-4 py-1.5 text-xs font-bold text-navy-800">📁 {y}</div>
                  <ul className="divide-y divide-slate-100">
                    {list.filter((d) => d.year === y).map((d) => <DocRow key={d.id} doc={d} clientId={client.id} showSection={false} />)}
                  </ul>
                </div>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
