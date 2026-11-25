"use client";
import { useState } from "react";
import PoaDialog from "./PoaDialog";
import { useI18n } from "@/components/store/I18n";
import { useClient } from "@/components/store/stores";

/** تنبيه التوكيل للعميل + آخر نسخة من «صيغة توكيل عميل للمكتب» المحفوظة في Google Sheets، معبأة ببياناته */
export default function PoaNotice() {
  const { t } = useI18n();
  const s = useClient();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
        <span className="text-2xl">📜</span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-7 text-amber-900">{t.portal.poaAlert}</p>
        <button type="button" onClick={() => setOpen(true)} className="btn-navy">{t.portal.poaShow}</button>
      </div>
      {open && (
        <PoaDialog
          settings={s.data?.SiteSettings ?? []}
          client={s.data?.Me ?? null}
          kinds={["client"]}
          title={t.portal.poaModalTitle}
          hint={t.portal.poaModalHint}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
