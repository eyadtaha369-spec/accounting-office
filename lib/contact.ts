/** رابط واتساب المكتب من رقم التذييل */
export function officeWhatsApp(phone: string, text = "") {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
