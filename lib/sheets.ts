import "server-only";

export type Row = Record<string, string>;
export type Table = "Users" | "Requests" | "Files" | "StatusHistory" | "Notes" | "Credentials";
export type Op =
  | { op: "select"; table: Table; where?: Record<string, string | string[]> }
  | { op: "insert"; table: Table; row: Row }
  | { op: "update"; table: Table; id: string; patch: Row }
  | { op: "upsert"; table: Table; row: Row };

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
