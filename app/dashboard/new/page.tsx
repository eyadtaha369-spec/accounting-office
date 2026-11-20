import NewRequestForm from "./NewRequestForm";
import { requireLogin } from "@/lib/auth";
import { getDict } from "@/lib/locale";
import { REQUEST_TYPES } from "@/lib/i18n";

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireLogin();
  const { t } = await getDict();
  const sp = await searchParams;
  const initial = (REQUEST_TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "tax_return";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy-900">{t.dash.newRequest}</h1>
      <NewRequestForm t={t} initialType={initial} />
    </div>
  );
}
