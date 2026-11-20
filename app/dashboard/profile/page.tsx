import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { requireLogin } from "@/lib/auth";
import { getUser } from "@/lib/db";
import { getDict } from "@/lib/locale";

export default async function ProfilePage() {
  const s = await requireLogin();
  const profile = await getUser(s.uid);
  if (!profile) redirect("/login");
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy-900">{t.dash.profile}</h1>
      <ProfileForm t={t} profile={profile} />
    </div>
  );
}
