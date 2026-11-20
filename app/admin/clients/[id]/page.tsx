import Link from "next/link";
import { notFound } from "next/navigation";
import RequestsTable from "@/components/RequestsTable";
import DriveImage from "@/components/DriveImage";
import PortalCard from "./PortalCard";
import NoteForm from "./NoteForm";
import AddRequestForm from "./AddRequestForm";
import ResetPassword from "./ResetPassword";
import EditClient from "./EditClient";
import RecordsPanel, { type RecordView } from "@/components/ops/RecordsPanel";
import TasksPanel, { type TaskView } from "@/components/ops/TasksPanel";
import DocsPanel, { type DocView } from "@/components/ops/DocsPanel";
import { Panel, Pill } from "@/components/ops/Panel";
import { requireStaff } from "@/lib/auth";
import { clientBundle } from "@/lib/db";
import { downloadTicket } from "@/lib/tickets";
import { getDict } from "@/lib/locale";
import { fmtDate } from "@/lib/format";
import { PORTAL_URLS } from "@/lib/i18n";

export default async function ClientFile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireStaff();
  const { t, locale } = await getDict();
  const isAdmin = me.role === "admin";

  const b = await clientBundle(id);
  if (!b) notFound();
  const c = b.client;
  const savedPortals = isAdmin ? b.savedPortals : new Set<string>();
  const url = process.env.APPS_SCRIPT_URL!;

  const name = c.full_name;
  const records = b.records.map((r) => ({ ...r, clientName: name })) as unknown as RecordView[];
  const tasks = b.tasks.map((r) => ({ ...r, clientName: name })) as unknown as TaskView[];
  const docs = b.docs.map((d) => ({ ...d, clientName: name, ticket: downloadTicket(d.drive_file_id) })) as unknown as DocView[];
  const fs = c.file_status || "active";
  const fsTone: Record<string, string> = { onboarding: "bg-amber-50 text-amber-800 ring-amber-200", active: "bg-emerald-50 text-emerald-800 ring-emerald-200", suspended: "bg-orange-50 text-orange-800 ring-orange-200", closed: "bg-slate-100 text-slate-600 ring-slate-200" };

  const fields: [string, string | null, boolean?][] = [
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

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-navy-700">← {t.admin.clients}</Link>

      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-900 text-xl font-bold text-gold-400">{c.full_name.trim().charAt(0)}</div>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{c.full_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-slate-500">{t.admin.clientFile}</p>
            <Pill className={fsTone[fs] ?? fsTone.active}>{t.fileStatus[fs as keyof typeof t.fileStatus] ?? fs}</Pill>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client data */}
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
            <a
              href={`https://wa.me/2${c.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline mt-5 text-emerald-700"
            >
              WhatsApp
            </a>
          )}
          <div className="mt-5 border-t border-slate-100 pt-5">
            <EditClient t={t} client={c} />
          </div>
          <div className="mt-3">
            <ResetPassword t={t} clientId={c.id} name={c.full_name} phone={c.phone} email={c.email} />
          </div>
        </section>

        {/* ID card */}
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-navy-900">{t.admin.idCard}</h2>
          <div className="space-y-3">
            {[
              { label: t.auth.idFront, file: c.id_front_file },
              { label: t.auth.idBack, file: c.id_back_file },
            ].map((img) => (
              <div key={img.label}>
                <div className="mb-1 text-xs text-slate-500">{img.label}</div>
                {img.file ? (
                  <DriveImage url={url} ticket={downloadTicket(img.file)} alt={img.label} label={`${t.admin.preview} / ${t.dash.download}`} />
                ) : (
                  <div className="grid h-24 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400">{t.admin.noImage}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Government portals */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-bold text-navy-900">{t.admin.portals}</h2>
        {isAdmin && <p className="mt-1 text-xs text-slate-500">{t.admin.credsNote}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <PortalCard t={t} clientId={id} portal="tax_portal" title={t.admin.portalTax} url={PORTAL_URLS.tax_portal} saved={savedPortals.has("tax_portal")} canManage={isAdmin} />
          <PortalCard t={t} clientId={id} portal="e_invoice" title={t.admin.portalEinvoice} url={PORTAL_URLS.e_invoice} saved={savedPortals.has("e_invoice")} canManage={isAdmin} />
        </div>
      </section>

      {/* History */}
      <section className="card overflow-hidden">
        <div className="space-y-4 border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-navy-900">{t.admin.history}</h2>
          <AddRequestForm t={t} clientId={c.id} />
        </div>
        <RequestsTable rows={b.requests} t={t} locale={locale} showClient={false} showCompleted empty={t.dash.noRequests} />
      </section>

      <Panel title={t.ops.clientRecords}>
        <RecordsPanel t={t} locale={locale} rows={records} clients={[]} lockedClientId={c.id} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t.ops.clientTasks}>
          <TasksPanel t={t} locale={locale} rows={tasks} clients={[]} lockedClientId={c.id} />
        </Panel>
        <Panel title={t.ops.clientDocs}>
          <DocsPanel t={t} locale={locale} rows={docs} clients={[]} url={url} lockedClientId={c.id} />
        </Panel>
      </div>

      {/* Internal notes */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-bold text-navy-900">{t.admin.internalNotes}</h2>
        <NoteForm clientId={id} label={t.admin.addNote} />
        <ul className="mt-4 space-y-3">
          {b.notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-amber-50/60 p-3 text-sm ring-1 ring-amber-100">
              <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
              <p className="mt-1.5 text-xs text-slate-500">
                {n.author_name} · {fmtDate(n.created_at, locale, true)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
