import type { Dict } from "./i18n";

export function requestLabel(t: Dict, type: string, sub?: string | null) {
  const base = (t.requestTypes as Record<string, string>)[type] ?? type;
  const subLabel = sub ? (t.taxReturnTypes as Record<string, string>)[sub] : null;
  return subLabel ? `${base} — ${subLabel}` : base;
}
