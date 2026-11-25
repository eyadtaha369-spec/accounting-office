"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequestsTable, { type AdminRequestRow } from "@/components/RequestsTable";
import DriveImage from "@/components/DriveImage";
import PortalCard from "./client/PortalCard";
import NoteForm from "./client/NoteForm";
import AddRequestForm from "./client/AddRequestForm";
import ResetPassword from "./client/ResetPassword";
import EditClient from "./client/EditClient";
import RecordsPanel, { type RecordView } from "@/components/ops/RecordsPanel";
import TasksPanel, { type TaskView } from "@/components/ops/TasksPanel";
import DocsPanel, { type DocView } from "@/components/ops/DocsPanel";
import { Panel, Pill } from "@/components/ops/Panel";
import { useAdmin } from "@/components/store/stores";
import { useI18n, useMe } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { fmtDate } from "@/lib/format";
import { PORTAL_URLS } from "@/lib/i18n";
import { desc, dueAsc, isTmp } from "@/lib/view";
import { useState } from "react";
import { AdminVault } from "@/components/portal/Vault";
import Compliance from "@/components/portal/Compliance";
import InvoicesArchive from "@/components/portal/InvoicesArchive";
import Billing from "@/components/portal/Billing";
import { asPortal } from "@/components/portal/types";
import AdminArchive from "./archive/AdminArchive";
import ServicesTab from "./archive/ServicesTab";

const fsTone: Record<string, string> = {
  onboarding: "bg-amber-50 text-amber-800 ring-amber-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  suspended: "bg-orange-50 text-orange-800 ring-orange-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function ClientFileView() {
  const { id } = useParams<{ id: string }>();
  const s = useAdmin();
  const me = useMe();
  const { t, locale } = useI18n();
  const isAdmin = me.role === "admin";
  const [tab, setTab] = useState<"data" | "services" | "archive" | "requests" | "vault" | "invoices" | "billing" | "ops" | "notes">("data");

  return (
    <Guard s={s}>
      {(d) => {
        const c = d.Users.find((u) => u.id === id);
        if (!c) return <p className="card p-10 text-center text-slate-500">404</p>;
        const name = c.full_name;
        const requests = d.Requests.filter((r) => r.client_id === id).sort(desc()) as unknown as AdminRequestRow[];
        const records = d.ServiceRecords.filter((r) => r.client_id === id).sort(dueAsc).map((r) => ({ ...r, clientName: name })) as unknown as RecordView[];
        const tasks = d.Tasks.filter((r) => r.client_id === id)
          .sort((a, b) => (a.status === b.status ? dueAsc(a, b) : a.status === "done" ? 1 : -1))
          .map((r) => ({ ...r, clientName: name })) as unknown as TaskView[];
        const docs = d.Documents.filter((x) => x.client_id === id).sort(desc()).map((x) => ({ ...x, clientName: name, ticket: s.ticket(x.drive_file_id) })) as unknown as DocView[];
        const notes = d.Notes.filter((n) => n.client_id === id).sort(desc());
        const saved = new Set(d.Portals.filter((p) => p.client_id === id).map((p) => p.portal));
        const fs = c.file_status || "active";
        const fields: [string, string | undefined, boolean?][] = [
          [t.auth.fullName, c.full_name],
          [t.auth.email, c.email, true],
          [t.auth.phone, c.phone, true],
          [t.auth.phoneAlt, c.phone_alt, true],
          [t.auth.nationalId, c.national_id, true],
          [t.auth.taxNumber, c.tax_registration_number, true],
          [t.auth.clientType, t.clientTypes[c.client_type as keyof typeof t.clientTypes]],
          [t.auth.companyName, c.company_name],
          [t.auth.taxOffice, c.tax_office],
          [t.auth.address, c.address],
          [t.dash.date, fmtDate(c.created_at, locale)],
        ];
        const saving = isTmp(c.id);

        return (
          <div className="space-y-6">
            <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-navy-700">← {t.admin.clients}</Link>
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-900 text-xl font-bold text-gold-400">{c.full_name?.trim().charAt(0)}</div>
              <div>
                <h1 className="text-2xl font-bold text-navy-900">{c.full_name}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-slate-500">{t.admin.clientFile}</p>
                  <Pill className={fsTone[fs] ?? fsTone.active}>{t.fileStatus[fs as keyof typeof t.fileStatus] ?? fs}</Pill>
                  {saving && <span className="text-xs text-slate-400">{t.sync.syncing}</span>}
                </div>
              </div>
            </div>

            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {([
                ["data", t.admin.clientData],
                ["services", `⚙️ ${t.arch.servicesTab}`],
                ["archive", `🗄️ ${t.arch.myArchive}`],
                ["requests", t.admin.history],
                ["vault", t.portal.vaultTitle],
                ["invoices", t.portal.invoicesTitle],
                ["billing", t.portal.billingTitle],
                ["ops", `${t.ops.nav.records} / ${t.ops.nav.tasks}`],
                ["notes", t.admin.internalNotes],
              ] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${tab === k ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "data" && (
            <>
            <div className="grid gap-6 lg:grid-cols-3">
              <section className="card p-5 sm:p-6 lg:col-span-2">
                <h2 className="mb-4 font-bold text-navy-900">{t.admin.clientData}</h2>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {fields.map(([k, v, ltr]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-400">{k}</dt>
                      <dd className={`mt-0.5 font-medium text-slate-800 ${ltr ? "ltr-num" : ""}`}>{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
                {c.phone && (
                  <a href={`https://wa.me/2${c.phone}`} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5 text-emerald-700">WhatsApp</a>
                )}
                {!saving && (
                  <>
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <EditClient key={c.updated_at + c.id} t={t} client={c} />
                    </div>
                    <div className="mt-3">
                      <ResetPassword t={t} clientId={c.id} name={c.full_name} phone={c.phone} email={c.email} />
                    </div>
                  </>
                )}
              </section>
              <section className="card p-5 sm:p-6">
                <h2 className="mb-4 font-bold text-navy-900">{t.admin.idCard}</h2>
                <div className="space-y-3">
                  {[
                    { label: t.auth.idFront, file: c.id_front_file },
                    { label: t.auth.idBack, file: c.id_back_file },
                  ].map((img) => (
                    <div key={img.label}>
                      <div className="mb-1 text-xs text-slate-500">{img.label}</div>
                      {img.file && s.ticket(img.file) ? (
                        <DriveImage url={s.url} ticket={s.ticket(img.file)} alt={img.label} label={`${t.admin.preview} / ${t.dash.download}`} />
                      ) : (
                        <div className="grid h-24 place-items-center rounded-xl bg-page text-xs text-slate-400">{t.admin.noImage}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {!saving && (
              <>
                <Panel title={`📜 ${t.portal.compliance}`}>
                  <Compliance key={c.updated_at + c.id} client={c} />
                </Panel>
                <section className="card p-5 sm:p-6">
                  <h2 className="font-bold text-navy-900">{t.admin.portals}</h2>
                  {isAdmin && <p className="mt-1 text-xs text-slate-500">{t.admin.credsNote}</p>}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <PortalCard t={t} clientId={id} portal="tax_portal" title={t.admin.portalTax} url={PORTAL_URLS.tax_portal} saved={saved.has("tax_portal")} canManage={isAdmin} />
                    <PortalCard t={t} clientId={id} portal="e_invoice" title={t.admin.portalEinvoice} url={PORTAL_URLS.e_invoice} saved={saved.has("e_invoice")} canManage={isAdmin} />
                  </div>
                </section>
              </>
            )}
            </>
            )}

            {!saving && tab === "services" && <ServicesTab client={c} savedPortals={saved} />}

            {!saving && tab === "archive" && (
              <Panel title={`🗄️ ${t.arch.archiveTitle}`} hint={t.arch.archiveHint}>
                <AdminArchive clientId={c.id} />
              </Panel>
            )}

            {!saving && tab === "requests" && (
                <section className="card overflow-hidden">
                  <div className="space-y-4 border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-navy-900">{t.admin.history}</h2>
                    <AddRequestForm t={t} clientId={c.id} />
                  </div>
                  <RequestsTable rows={requests} t={t} locale={locale} showClient={false} showCompleted empty={t.dash.noRequests} />
                </section>
            )}

            {!saving && tab === "vault" && (
              <Panel title={`🗂️ ${t.portal.vaultTitle}`} hint={t.portal.vaultHint}>
                <AdminVault client={c} />
              </Panel>
            )}

            {!saving && tab === "invoices" && (
              <Panel title={`🧾 ${t.portal.invoicesTitle}`} hint={t.portal.invoicesHint}>
                <InvoicesArchive store={asPortal(s)} rows={d.MonthlyInvoices.filter((x) => x.client_id === id)} clientId={id} />
              </Panel>
            )}

            {!saving && tab === "billing" && (
              <Panel title={`💳 ${t.portal.billingTitle}`}>
                <Billing store={asPortal(s)} rows={d.BillingLedger.filter((x) => x.client_id === id)} clientId={id} />
              </Panel>
            )}

            {!saving && tab === "ops" && (
              <>
                <Panel title={t.ops.clientRecords}>
                  <RecordsPanel t={t} locale={locale} rows={records} clients={[]} lockedClientId={c.id} />
                </Panel>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title={t.ops.clientTasks}>
                    <TasksPanel t={t} locale={locale} rows={tasks} clients={[]} lockedClientId={c.id} />
                  </Panel>
                  <Panel title={t.ops.clientDocs}>
                    <DocsPanel t={t} locale={locale} rows={docs} clients={[]} url={s.url} lockedClientId={c.id} />
                  </Panel>
                </div>
              </>
            )}

            {!saving && tab === "notes" && (
                <section className="card p-5 sm:p-6">
                  <h2 className="mb-4 font-bold text-navy-900">{t.admin.internalNotes}</h2>
                  <NoteForm clientId={id} />
                  <ul className="mt-4 space-y-3">
                    {notes.map((n) => (
                      <li key={n.id} className={`rounded-xl bg-amber-50/60 p-3 text-sm ring-1 ring-amber-100 ${isTmp(n.id) ? "opacity-60" : ""}`}>
                        <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
                        <p className="mt-1.5 text-xs text-slate-500">{n.author_name} · {fmtDate(n.created_at, locale, true)}</p>
                      </li>
                    ))}
                  </ul>
                </section>
            )}
          </div>
        );
      }}
    </Guard>
  );
}
