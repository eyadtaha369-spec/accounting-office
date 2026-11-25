"use client";
import ProfileForm from "./ProfileForm";
import PoaNotice from "@/components/portal/PoaNotice";
import FileList from "@/components/FileList";
import { useClient } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";
import { desc } from "@/lib/view";
import { VaultGrid } from "@/components/portal/Vault";
import { Panel } from "@/components/ops/Panel";

const tone: Record<string, string> = {
  onboarding: "bg-amber-50 text-amber-800 ring-amber-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  suspended: "bg-orange-50 text-orange-800 ring-orange-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function ProfileView() {
  const s = useClient();
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.dash.profile}</h1>
      <Guard s={s}>
        {(d) => {
          if (!d.Me) return null;
          const fs = d.Me.file_status || "active";
          const files = [...d.Documents].sort(desc()).map((x) => ({ id: x.id, file_name: x.title || x.file_name, ticket: s.ticket(x.drive_file_id) }));
          return (
            <>
              <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
                <span className="text-sm font-medium text-slate-600">{t.ops.fileStatus}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${tone[fs] ?? tone.active}`}>{t.fileStatus[fs as keyof typeof t.fileStatus] ?? fs}</span>
              </div>
              <Panel title={`🗂️ ${t.portal.vaultTitle}`} hint={t.portal.vaultHint}>
                <VaultGrid row={d.Me} url={s.url} ticket={s.ticket} />
              </Panel>
              <div className="card p-5">
                <h2 className="mb-3 font-bold text-navy-900">📜 {t.portal.poaTitle}</h2>
                {d.Me.poa_has === "yes" ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-slate-400">{t.portal.poaNumber}</dt><dd className="ltr-num font-medium">{d.Me.poa_number || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-400">{t.portal.poaLetterYear}</dt><dd className="font-medium">{d.Me.poa_letter_year || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-400">{t.portal.poaOffice}</dt><dd className="font-medium">{d.Me.poa_office || "—"}</dd></div>
                  </dl>
                ) : (
                  <PoaNotice />
                )}
              </div>
              <ProfileForm key={d.Me.updated_at} t={t} profile={d.Me} />
              <div className="card p-5 sm:p-6">
                <h2 className="mb-4 font-bold text-navy-900">{t.ops.myDocuments}</h2>
                <FileList files={files} url={s.url} downloadLabel={t.dash.download} />
              </div>
            </>
          );
        }}
      </Guard>
    </div>
  );
}
