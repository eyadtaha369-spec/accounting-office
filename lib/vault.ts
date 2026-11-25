// خزنة المستندات الدائمة: القيمة في عمود العميل إما drive:ID|اسم الملف أو url:الرابط
export const VAULT_KEYS = ["tax_card", "commercial_register", "vat_certificate", "incorporation", "balance_sheet"] as const;
export type VaultKey = (typeof VAULT_KEYS)[number];
export type VaultItem = { type: "drive"; id: string; name: string } | { type: "url"; url: string };

export function parseVault(v: string | undefined | null): VaultItem | null {
  if (!v) return null;
  if (v.startsWith("drive:")) {
    const [id, ...rest] = v.slice(6).split("|");
    return id ? { type: "drive", id, name: rest.join("|") || "file" } : null;
  }
  if (v.startsWith("url:")) {
    const url = v.slice(4);
    return /^https?:\/\//i.test(url) ? { type: "url", url } : null;
  }
  return null;
}

export function vaultDriveIds(row: Record<string, string>) {
  return [...VAULT_KEYS.map((k) => row[`vault_${k}`]), row.poa_file]
    .map(parseVault)
    .filter((x): x is { type: "drive"; id: string; name: string } => x?.type === "drive")
    .map((x) => x.id);
}
