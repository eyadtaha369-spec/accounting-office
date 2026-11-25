import type { icons } from "@/components/Icons";
import type { ClientService } from "@/lib/services";

export const SERVICE_ICON: Record<ClientService | "general", keyof typeof icons> = {
  vat: "percent", income: "landmark", einvoice: "receipt", payroll: "users", insurance: "shield",
  financials: "report", audit: "search", formation: "building", general: "archive",
};

/** ربط أنواع الطلبات بالخدمات لعرض الطلبات المتعلقة بكل خدمة */
export function serviceOfRequest(type: string, sub?: string): ClientService | null {
  if (type === "tax_return") return sub === "vat" ? "vat" : sub === "payroll" ? "payroll" : "income";
  return ({ e_invoice: "einvoice", social_insurance: "insurance", financial_statements: "financials", company_formation: "formation", tax_inspection: "income", tax_card: "income" } as Record<string, ClientService>)[type] ?? null;
}
