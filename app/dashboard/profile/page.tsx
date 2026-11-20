import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import FileList from "@/components/FileList";
import { requireLogin } from "@/lib/auth";
import { toProfile } from "@/lib/db";
import { batch, type Row } from "@/lib/sheets";
import { downloadTicket } from "@/lib/tickets";
import { getDict } from "@/lib/locale";

export default async function ProfilePage() {
  const s = await requireLogin();
  const [users, docs] = (await batch([
    { op: "select", table: "Users", where: { id: s.uid } },
    { op: "select", table: "Documents", where: { client_id: s.uid, visible_to_client: "yes" } },
  ])) as [Row[], Row[]];
  if (!users[0]) redirect("/login");
  const profile = toProfile(users[0]);
  const { t } = await getDict();
  const fs = profile.file_status || "active";
  const tone: Record<string, string> = { onboarding: "bg-amber-50 text-amber-800 ring-amber-200", active: "bg-emerald-50 text-emerald-800 ring-emerald-200", suspended: "bg-orange-50 text-orange-800 ring-orange-200", closed: "bg-slate-100 text-slate-600 ring-slate-200" };
  const files = docs
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((d) => ({ id: d.id, file_name: d.title || d.file_name, ticket: downloadTicket(d.drive_file_id) }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.dash.profile}</h1>
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <span className="text-sm font-medium text-slate-600">{t.ops.fileStatus}</span>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${tone[fs] ?? tone.active}`}>
          {t.fileStatus[fs as keyof typeof t.fileStatus] ?? fs}
        </span>
      </div>
      <ProfileForm t={t} profile={profile} />
      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 font-bold text-navy-900">{t.ops.myDocuments}</h2>
        <FileList files={files} url={process.env.APPS_SCRIPT_URL!} downloadLabel={t.dash.download} />
      </div>
    </div>
  );
}
