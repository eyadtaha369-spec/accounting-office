import type { Locale } from "./i18n";

export function fmtDate(d: string | null | undefined, locale: Locale, withTime = false) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(d));
}

export function checkFiles(files: File[]) {
  return files.every((f) => ALLOWED_DOC_TYPES.includes(f.type) && f.size > 0 && f.size <= MAX_DOC_BYTES);
}

export const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
