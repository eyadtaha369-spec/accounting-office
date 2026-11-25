"use client";
import InvoicesArchive from "@/components/portal/InvoicesArchive";
import Billing from "@/components/portal/Billing";
import { Panel } from "@/components/ops/Panel";
import { asPortal } from "@/components/portal/types";
import { useClient } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";

export function ClientInvoices() {
  const s = useClient();
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.portal.invoicesTitle}</h1>
      <Guard s={s}>
        {(d) => (
          <Panel title={`🧾 ${t.portal.invoicesTitle}`} hint={t.portal.invoicesHint}>
            <InvoicesArchive store={asPortal(s)} rows={d.MonthlyInvoices} />
          </Panel>
        )}
      </Guard>
    </div>
  );
}

export function ClientBilling() {
  const s = useClient();
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">{t.portal.billingTitle}</h1>
      <Guard s={s}>
        {(d) => (
          <Panel title={`💳 ${t.portal.billingTitle}`}>
            <Billing store={asPortal(s)} rows={d.BillingLedger} />
          </Panel>
        )}
      </Guard>
    </div>
  );
}
