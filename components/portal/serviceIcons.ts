/** ربط أنواع الطلبات بالخدمات لعرض الطلبات المتعلقة بكل خدمة */
export function serviceOfRequest(type: string, sub?: string): string | null {
  if (type === "tax_return") return sub === "vat" ? "vat" : sub === "payroll" ? "payroll" : "income";
  return ({ e_invoice: "einvoice", social_insurance: "insurance", financial_statements: "financials", company_formation: "formation", tax_inspection: "income", tax_card: "income", feasibility: "feasibility" } as Record<string, string>)[type] ?? null;
}
