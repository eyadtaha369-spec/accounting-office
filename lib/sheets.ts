import "server-only";

export type Row = Record<string, string>;
export type Table = "Users" | "Requests" | "Files" | "StatusHistory" | "Notes" | "Credentials" | "ServiceRecords" | "Tasks" | "Finance" | "Documents" | "MonthlyInvoices" | "BillingLedger" | "ArchiveYears" | "ArchiveDocs" | "site_pages" | "site_settings";
export type Op =
  | { op: "select"; table: Table; where?: Record<string, string | string[]> }
  | { op: "insert"; table: Table; row: Row }
  | { op: "update"; table: Table; id: string; patch: Row }
  | { op: "upsert"; table: Table; row: Row }
  | { op: "delete"; table: Table; id: string };

/** ينفّذ مجموعة عمليات في طلب واحد إلى Apps Script */
export async function batch(ops: Op[]): Promise<unknown[]> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("APPS_SCRIPT_URL / APPS_SCRIPT_SECRET are not set");
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ secret, action: "batch", ops }),
    cache: "no-store",
    redirect: "follow",
  });
  const text = await res.text();
  let json: { data?: unknown[]; error?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Apps Script returned non-JSON. Check the deployment access is 'Anyone'.");
  }
  if (json.error) throw new Error(`Apps Script: ${json.error}`);
  return json.data ?? [];
}

export async function select(table: Table, where: Record<string, string | string[]> = {}) {
  return (await batch([{ op: "select", table, where }]))[0] as Row[];
}
export async function insert(table: Table, row: Row) {
  return (await batch([{ op: "insert", table, row }]))[0] as Row;
}
export async function update(table: Table, id: string, patch: Row) {
  return (await batch([{ op: "update", table, id, patch }]))[0] as Row;
}
export async function remove(table: Table, id: string) {
  return (await batch([{ op: "delete", table, id }]))[0] as { deleted: boolean };
}

/** لقطة كاملة لعدة جداول في طلب واحد — ترجع unchanged إذا لم تتغير البيانات منذ الإصدار المعروف */
export async function snapshot(tables: string[], known?: string) {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("APPS_SCRIPT_URL / APPS_SCRIPT_SECRET are not set");
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ secret, action: "snapshot", tables, known }),
    cache: "no-store",
    redirect: "follow",
  });
  const json = JSON.parse(await res.text()) as { data?: { unchanged?: boolean; version: string; tables?: Record<string, Row[]> }; error?: string };
  if (json.error === "unknown_action") {
    // نسخة Code.gs قديمة: نفس الطلب الواحد عبر batch (بدون كاش أو رقم إصدار)
    const rows = (await batch(tables.map((table) => ({ op: "select" as const, table: table as Table })))) as Row[][];
    return { unchanged: false, version: `legacy-${Date.now()}`, tables: Object.fromEntries(tables.map((t, i) => [t, rows[i] ?? []])) };
  }
  if (json.error || !json.data) throw new Error(`Apps Script: ${json.error ?? "no data"}`);
  return json.data;
}
