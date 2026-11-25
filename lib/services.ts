// الخدمات التي يمكن تفعيلها لكل عميل — تتحكم في الصفحات الظاهرة له
export const CLIENT_SERVICES = ["vat", "income", "einvoice", "payroll", "insurance", "financials", "audit", "formation"] as const;
export type ClientService = (typeof CLIENT_SERVICES)[number];
export const ARCHIVE_SECTIONS = ["general", ...CLIENT_SERVICES] as const;

export function parseServices(v: string | undefined | null): ClientService[] {
  return String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is ClientService => (CLIENT_SERVICES as readonly string[]).includes(x));
}

export const serializeServices = (list: string[]) =>
  CLIENT_SERVICES.filter((s) => list.includes(s)).join(",");
