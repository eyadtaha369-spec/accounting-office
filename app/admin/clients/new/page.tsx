import Link from "next/link";
import NewClientForm from "./NewClientForm";
import { requireStaff } from "@/lib/auth";
import { getDict } from "@/lib/locale";

export default async function NewClientPage() {
  await requireStaff();
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-navy-700">← {t.admin.clients}</Link>
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t.admin.addClient}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.admin.addClientHint}</p>
      </div>
      <NewClientForm t={t} />
    </div>
  );
}
