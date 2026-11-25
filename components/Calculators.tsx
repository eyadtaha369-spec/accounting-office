"use client";
import Link from "next/link";
import { useState } from "react";
import { payroll, vatAdd, vatExtract } from "@/lib/tax";
import { FORMATION, type FormationType } from "@/lib/formation";
import { normalizeDigits } from "@/lib/validation";
import type { Dict } from "@/lib/i18n";
import { Icon } from "./Icons";

const num = (v: string) => {
  const n = Number(normalizeDigits(v).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 });

/** حاسبات تفاعلية تعمل بالكامل في المتصفح */
export default function Calculators({ t }: { t: Dict }) {
  const p = t.portal;
  const [tab, setTab] = useState<"vat" | "payroll" | "formation">("vat");
  return (
    <section id="calculators" className="scroll-mt-16 bg-white py-20">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gold-500" />
          <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">{p.calcTitle}</h2>
          <p className="mt-3 text-slate-600">{p.calcSubtitle}</p>
        </div>
        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl bg-navy-900 shadow-xl ring-1 ring-navy-800">
          <div className="grid grid-cols-3 border-b border-white/10">
            {([
              ["vat", p.calcVat, "percent"],
              ["payroll", p.calcPayroll, "users"],
              ["formation", p.calcFormation, "building"],
            ] as const).map(([k, label, icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex flex-col items-center gap-1.5 px-2 py-4 text-xs font-semibold transition sm:flex-row sm:justify-center sm:text-sm ${tab === k ? "bg-gold-500 text-navy-950" : "text-white/75 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon name={icon} className="h-5 w-5" /> {label}
              </button>
            ))}
          </div>
          <div className="bg-white p-5 sm:p-8">
            {tab === "vat" && <VatCalc t={t} />}
            {tab === "payroll" && <PayrollCalc t={t} />}
            {tab === "formation" && <FormationCalc t={t} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${strong ? "bg-navy-900 text-white" : "bg-page"}`}>
      <span className={`text-sm ${strong ? "text-gold-300" : "text-slate-600"}`}>{label}</span>
      <span className={`ltr-num font-bold ${strong ? "text-xl" : "text-navy-900"}`}>{value}</span>
    </div>
  );
}

function VatCalc({ t }: { t: Dict }) {
  const p = t.portal;
  const [mode, setMode] = useState<"add" | "extract">("add");
  const [v, setV] = useState("10000");
  const r = mode === "add" ? vatAdd(num(v)) : vatExtract(num(v));
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-page p-1">
          {(["add", "extract"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === m ? "bg-white text-navy-900 shadow-sm" : "text-slate-500"}`}>
              {m === "add" ? p.vatAdd : p.vatExtract}
            </button>
          ))}
        </div>
        <div>
          <label className="label">{mode === "add" ? p.beforeVat : p.afterVat}</label>
          <input value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" className="input text-lg" dir="ltr" />
        </div>
      </div>
      <div className="space-y-2">
        <Result label={p.beforeVat} value={fmt(r.net)} />
        <Result label={p.vatValue} value={fmt(r.vat)} />
        <Result label={p.afterVat} value={fmt(r.gross)} strong />
      </div>
    </div>
  );
}

function PayrollCalc({ t }: { t: Dict }) {
  const p = t.portal;
  const [v, setV] = useState("15000");
  const [insured, setInsured] = useState(true);
  const r = payroll(num(v), insured);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="label">{p.grossSalary}</label>
          <input value={v} onChange={(e) => setV(e.target.value)} inputMode="decimal" className="input text-lg" dir="ltr" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} className="h-4 w-4 accent-[#14243b]" />
          {p.insured}
        </label>
        <p className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-900">ℹ️ {p.payrollNote}</p>
      </div>
      <div className="space-y-2">
        <Result label={p.insurance} value={fmt(r.insurance)} />
        <Result label={p.monthlyTax} value={fmt(r.monthlyTax)} />
        <Result label={p.annualTax} value={fmt(r.annualTax)} />
        <Result label={p.martyrs} value={fmt(r.martyrs)} />
        <Result label={p.netSalary} value={fmt(r.net)} strong />
      </div>
    </div>
  );
}

function FormationCalc({ t }: { t: Dict }) {
  const p = t.portal;
  const [type, setType] = useState<FormationType>("llc");
  const [cap, setCap] = useState("100000");
  const f = FORMATION[type];
  const capital = num(cap);
  const low = f.minCapital > 0 && capital < f.minCapital;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">{p.companyType}</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FORMATION) as FormationType[]).map((k) => (
              <button key={k} onClick={() => setType(k)} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ring-1 ${type === k ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200"}`}>
                {p.formationTypes[k]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{p.capital}</label>
          <input value={cap} onChange={(e) => setCap(e.target.value)} inputMode="decimal" className="input text-lg" dir="ltr" />
          {low && <p className="field-error">⚠ {p.capitalLow}</p>}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Result label={p.minCapital} value={f.minCapital ? fmt(f.minCapital) : p.noMin} />
        <Result label={p.deposit} value={f.depositPct ? fmt(Math.max(capital, f.minCapital) * f.depositPct) : "—"} />
        <Result label={p.duration} value={`${f.days[0]}–${f.days[1]} ${p.workDays}`} strong />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-bold text-navy-900">{p.procedures}</h4>
          <ol className="space-y-2">
            {f.steps.map((s, i) => (
              <li key={s} className="flex gap-2 text-sm text-slate-700">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-500/15 text-xs font-bold text-gold-600">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="mb-2 font-bold text-navy-900">{p.requiredDocs}</h4>
          <ul className="space-y-2">
            {f.docs.map((d) => (
              <li key={d} className="flex gap-2 text-sm text-slate-700"><Icon name="check" className="mt-0.5 h-4 w-4 text-emerald-600" />{d}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-page p-3 text-xs leading-6 text-slate-600">{p.feesNote}</p>
          <Link href="/#contact" className="btn-gold mt-3">{p.getQuote}</Link>
        </div>
      </div>
    </div>
  );
}
