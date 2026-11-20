export const re = {
  phone: /^01[0125][0-9]{8}$/,
  nationalId: /^[23][0-9]{13}$/,
  tax: /^[0-9]{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

/** يحوّل الأرقام العربية/الفارسية إلى إنجليزية ويحذف المسافات والشرطات */
export function normalizeDigits(v: string) {
  return v
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\s-]/g, "")
    .replace(/^\+?20(?=1)/, "0");
}

export const ID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_ID_BYTES = 5 * 1024 * 1024;
