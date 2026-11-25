"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Stepper from "@/components/portal/Stepper";
import DocsByYear from "@/components/portal/DocsByYear";
import { Panel } from "@/components/ops/Panel";
import { Icon } from "@/components/Icons";
import { useClient } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { serviceOfRequest } from "@/components/portal/serviceIcons";
import { usePages } from "@/components/store/SitePages";
import { pageDesc } from "@/lib/site";
import { parseServices } from "@/lib/services";
import { requestLabel } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { desc } from "@/lib/view";
import type { Status } from "@/lib/i18n";

/** صفحة خدمة واحدة للعميل: مستنداتها بالسنوات + طلباتها */
export function ServiceView() {
  const { key } = useParams<{ key: string }>();
  const s = useClient();
  const { t, locale } = useI18n();
  const pages = usePages();
  return (
    <Guard s={s}>
      {(d) => {
        const page = pages.active.find((p) => p.id === key);
        if (!page || !parseServices(d.Me?.services).includes(key)) return <p className="card p-10 text-center text-slate-500">404</p>;
        const k = key;
        const about = pageDesc(page, locale);
        const docs = d.ArchiveDocs.filter((x) => x.section === k);
        const reqs = d.Requests.filter((r) => serviceOfRequest(r.request_type, r.sub_type) === k).sort(desc());
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-900 text-gold-400"><Icon name={pages.icon(k)} className="h-7 w-7" /></div>
              <div>
                <h1 className="text-2xl font-bold text-navy-900">{pages.label(k)}</h1>
                {about && <p className="mt-1 text-sm text-slate-500">{about.split("\n").join(" · ")}</p>}
              </div>
            </div>
            <Panel title={`📁 ${t.arch.sectionDocs}`}>
              <DocsByYear docs={docs} url={s.url} ticket={s.ticket} />
            </Panel>
            {reqs.length > 0 && (
              <Panel title={t.arch.relatedRequests}>
                <ul className="divide-y divide-slate-100">
                  {reqs.map((r) => (
                    <li key={r.id}>
                      <Link href={`/dashboard/requests/${r.id}`} className="flex flex-col gap-2 p-4 hover:bg-page sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{requestLabel(t, r.request_type, r.sub_type)}</div>
                          <div className="text-xs text-slate-500">#{r.reference_no} · {fmtDate(r.created_at, locale)}</div>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-56">
                          <StatusBadge status={r.status as Status} label={t.status[r.status as Status]} />
                          <Stepper status={r.status} compact />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        );
      }}
    </Guard>
  );
}

/** الأرشيف السنوي للعميل: السنوات والمستندات الظاهرة فقط */
export function ClientArchive() {
  const s = useClient();
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.arch.archiveTitle}</h1>
      <Guard s={s}>
        {(d) => (
          <Panel title={`🗄️ ${t.arch.archiveTitle}`}>
            <DocsByYear docs={d.ArchiveDocs} url={s.url} ticket={s.ticket} showSection />
          </Panel>
        )}
      </Guard>
    </div>
  );
}
