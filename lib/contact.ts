import { waNumber } from "@/lib/site";

/** رابط واتساب المكتب (الرقم من إعدادات الموقع) */
export function officeWhatsApp(phone: string, text = "") {
  return `https://wa.me/${waNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
