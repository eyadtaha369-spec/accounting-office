// قواعد ضريبية مصرية (محدّثة 2026) — تُستخدم في المتصفح للحاسبات ورادار المواعيد
// المصدر: قانون الضريبة على الدخل 91 لسنة 2005 وتعديلاته (القانون 7 لسنة 2024)

export const VAT_RATE = 0.14;

/** الشرائح السنوية بعد خصم الإعفاء الشخصي */
const BRACKETS: [number, number][] = [
  [40_000, 0],
  [55_000, 0.1],
  [70_000, 0.15],
  [200_000, 0.2],
  [400_000, 0.225],
  [1_200_000, 0.25],
  [Infinity, 0.275],
];
export const PERSONAL_EXEMPTION = 20_000; // سنوياً للعاملين بأجر
export const INSURANCE_EMPLOYEE_RATE = 0.11; // حصة العامل في التأمينات
export const INSURANCE_MAX_MONTHLY_WAGE = 16_700; // أقصى أجر تأميني شهري 2026 (تقريبي)
export const MARTYRS_FUND_RATE = 0.0005; // صندوق الشهداء 0.05% من إجمالي الأجر

/**
 * ضريبة سنوية على صافي الدخل الخاضع.
 * للدخول المرتفعة تُلغى الشرائح الأدنى تدريجياً (تعديلات 2024):
 * >600 ألف: تبدأ من 10% | >700 ألف: من 15% | >800 ألف: من 20% | >900 ألف: من 22.5% | >1.2 مليون: أول 1.2 مليون بـ 25%
 */
export function annualIncomeTax(taxable: number) {
  if (taxable <= 0) return 0;
  let startIdx = 0;
  if (taxable > 1_200_000) startIdx = 5;
  else if (taxable > 900_000) startIdx = 4;
  else if (taxable > 800_000) startIdx = 3;
  else if (taxable > 700_000) startIdx = 2;
  else if (taxable > 600_000) startIdx = 1;
  let tax = 0;
  let prev = 0;
  for (let i = 0; i < BRACKETS.length; i++) {
    const [cap, rate] = BRACKETS[i];
    // الشرائح الملغاة: المبلغ حتى نهايتها يخضع لسعر أول شريحة مسموحة
    const r = i < startIdx ? BRACKETS[startIdx][1] : rate;
    const slice = Math.min(taxable, cap) - prev;
    if (slice > 0) tax += slice * r;
    prev = cap;
    if (taxable <= cap) break;
  }
  return tax;
}

export function payroll(grossMonthly: number, insured = true) {
  const insurance = insured ? Math.min(grossMonthly, INSURANCE_MAX_MONTHLY_WAGE) * INSURANCE_EMPLOYEE_RATE : 0;
  const taxableAnnual = Math.max(0, (grossMonthly - insurance) * 12 - PERSONAL_EXEMPTION);
  const annualTax = annualIncomeTax(taxableAnnual);
  const monthlyTax = annualTax / 12;
  const martyrs = grossMonthly * MARTYRS_FUND_RATE;
  return { insurance, taxableAnnual, annualTax, monthlyTax, martyrs, net: grossMonthly - insurance - monthlyTax - martyrs };
}

export function vatAdd(net: number) {
  const vat = net * VAT_RATE;
  return { net, vat, gross: net + vat };
}
export function vatExtract(gross: number) {
  const net = gross / (1 + VAT_RATE);
  return { net, vat: gross - net, gross };
}

// ======================= رادار المواعيد الضريبية =======================
export type DeadlineKey = "vat" | "withholding" | "payroll_q" | "payroll_annual" | "income_individual" | "income_company";
export type Deadline = { key: DeadlineKey; due: string; period: string; service: "vat" | "withholding" | "payroll" | "income" };

const endOfMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)); // m0 = 0..11
const iso = (d: Date) => d.toISOString().slice(0, 10);
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/** كل المواعيد من اليوم وحتى عدد أيام محدد */
export function upcomingDeadlines(today = new Date(), horizonDays = 70): Deadline[] {
  const out: Deadline[] = [];
  const y0 = today.getUTCFullYear();
  for (let y = y0 - 1; y <= y0 + 1; y++) {
    for (let m = 0; m < 12; m++) {
      // القيمة المضافة: إقرار شهر m يُقدَّم حتى نهاية الشهر التالي
      out.push({ key: "vat", due: iso(endOfMonth(y, m + 1)), period: `${MONTHS_AR[m]} ${y}`, service: "vat" });
    }
    for (let q = 0; q < 4; q++) {
      // نموذج 41 ونموذج 4 مرتبات: نهاية الشهر التالي للربع (يناير/أبريل/يوليو/أكتوبر)
      const due = iso(endOfMonth(y, q * 3 + 3));
      const period = `Q${q + 1} ${y}`;
      out.push({ key: "withholding", due, period, service: "withholding" });
      out.push({ key: "payroll_q", due, period, service: "payroll" });
    }
    // التسوية السنوية للمرتبات: نهاية يناير عن السنة السابقة
    out.push({ key: "payroll_annual", due: iso(endOfMonth(y + 1, 0)), period: String(y), service: "payroll" });
    // الإقرار السنوي: 31 مارس للأفراد و30 أبريل للشركات (سنة مالية تنتهي 31 ديسمبر)
    out.push({ key: "income_individual", due: `${y + 1}-03-31`, period: String(y), service: "income" });
    out.push({ key: "income_company", due: `${y + 1}-04-30`, period: String(y), service: "income" });
  }
  const t = iso(today);
  const limit = iso(new Date(today.getTime() + horizonDays * 86400000));
  return out.filter((d) => d.due >= t && d.due <= limit).sort((a, b) => a.due.localeCompare(b.due));
}

export function daysUntil(dateIso: string, today = new Date()) {
  const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = dateIso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - a) / 86400000);
}

/** المواعيد التي تخص عميلاً حسب نوعه */
export function deadlinesForClient(clientType: string, today = new Date()) {
  const individual = clientType === "individual";
  return upcomingDeadlines(today, 120).filter((d) =>
    individual ? d.key === "income_individual" || d.key === "vat" : d.key !== "income_individual"
  );
}
