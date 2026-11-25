"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import NewRequestForm from "@/components/client/NewRequestForm";
import { useI18n } from "@/components/store/I18n";
import { REQUEST_TYPES } from "@/lib/i18n";

function Inner() {
  const { t } = useI18n();
  const type = useSearchParams().get("type") ?? "";
  const initial = (REQUEST_TYPES as readonly string[]).includes(type) ? type : "tax_return";
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy-900">{t.dash.newRequest}</h1>
      <NewRequestForm t={t} initialType={initial} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
