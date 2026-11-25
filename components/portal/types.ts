import type { StoreCtx } from "@/components/store/createStore";
import type { R } from "@/lib/store-types";

/** المكونات المشتركة بين لوحة العميل ولوحة الأدمن تحتاج هذين الجدولين فقط */
export type PortalStore = StoreCtx<{ MonthlyInvoices: R[]; BillingLedger: R[] }>;
export const asPortal = (s: unknown) => s as PortalStore;
