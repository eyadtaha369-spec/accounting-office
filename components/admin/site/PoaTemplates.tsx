"use client";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { savePoaSetting } from "@/app/admin/site-actions";
import {
  ACCOUNTANT_PLACEHOLDERS, DEFAULT_ACCOUNTANT_POA, DEFAULT_CLIENT_POA, DEFAULT_OFFICE_NAME, PLACEHOLDERS, POA_KEYS,
  fillPoa, poaTemplateOf, settingText, type PoaKind,
} from "@/lib/poa";
import { nowIso } from "@/lib/view";
import type { Row } from "@/lib/site";

/** حفظ إعداد واحد مع تحديث فوري (Optimistic) */
function useSaveSetting() {
  const s = useAdmin();
  const { t } = useI18n();
  return (key: keyof typeof POA_KEYS, value: string) => {
    const id = POA_KEYS[key];
    const row: Row = { id, value_ar: value, value_en: "", updated_at: nowIso() };
    void s.mutate({
      apply: (d) => ({ ...d, SiteSettings: [...d.SiteSettings.filter((r) => r.id !== id), row] }),
      run: () => savePoaSetting(key, value),
      error: t.sync.saveFailed,
    });
  };
}

export default function PoaTemplates() {
  const s = useAdmin();
  const { t } = useI18n();
  const save = useSaveSetting();
  const settings = s.data?.SiteSettings ?? [];
  const [office, setOffice] = useState({ name: settingText(settings, POA_KEYS.officeName) || DEFAULT_OFFICE_NAME, reg: settingText(settings, POA_KEYS.regNo) });
  const [officeSaved, setOfficeSaved] = useState(false);

  return (
    <div className="space-y-6 p-5">
      <p className="text-sm text-slate-500">{t.poaT.hint}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save("officeName", office.name.trim());
          save("regNo", office.reg.trim());
          setOfficeSaved(true);
        }}
        className="grid items-end gap-3 rounded-2xl bg-page/60 p-4 ring-1 ring-slate-200 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <label className="label">{t.poaT.officeName}</label>
          <input value={office.name} onChange={(e) => { setOffice({ ...office, name: e.target.value }); setOfficeSaved(false); }} className="input" maxLength={200} />
        </div>
        <div>
          <label className="label">{t.poaT.regNo}</label>
          <input value={office.reg} onChange={(e) => { setOffice({ ...office, reg: e.target.value }); setOfficeSaved(false); }} className="input ltr-num" placeholder="…" maxLength={60} />
        </div>
        <button className="btn-navy">{officeSaved ? `✓ ${t.poaT.saved}` : t.poaT.saveOffice}</button>
      </form>
      <Editor kind="client" settings={settings} onSave={(v) => save("client", v)} />
      <Editor kind="accountant" settings={settings} onSave={(v) => save("accountant", v)} />
    </div>
  );
}

function Editor({ kind, settings, onSave }: { kind: PoaKind; settings: Row[]; onSave: (v: string) => void }) {
  const { t } = useI18n();
  const saved = poaTemplateOf(settings, kind);
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const dirty = text !== saved;
  const chips = kind === "client" ? PLACEHOLDERS.filter((p) => !ACCOUNTANT_PLACEHOLDERS.includes(p)) : PLACEHOLDERS;

  function insert(ph: string) {
    const el = ref.current;
    if (!el) return setText((x) => x + ph);
    const [a, b] = [el.selectionStart, el.selectionEnd];
    const next = text.slice(0, a) + ph + text.slice(b);
    setText(next);
    setStatus("idle");
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + ph.length, a + ph.length); });
  }

  async function copy() {
    // النسخ من الإعدادات: المتغيرات تتحول لنقاط للاستكمال اليدوي
    await navigator.clipboard.writeText(fillPoa(text, { settings }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${kind === "client" ? "bg-gold-500/15 text-gold-700" : "bg-navy-900 text-gold-400"}`}>
          <Icon name={kind === "client" ? "users" : "briefcase"} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-navy-900">{kind === "client" ? t.poaT.clientTitle : t.poaT.accountantTitle}</h3>
          <p className="text-xs text-slate-500">{kind === "client" ? t.poaT.clientHint : t.poaT.accountantHint}</p>
        </div>
        <button type="button" onClick={copy} className={kind === "client" ? "btn-gold" : "btn-navy"}>
          <Icon name={copied ? "check" : "file"} className="h-4 w-4" /> {copied ? t.poaT.copied : kind === "client" ? t.poaT.copyClient : t.poaT.copyAccountant}
        </button>
      </div>
      <div className="space-y-3 bg-white p-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{t.poaT.placeholders}</p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((ph) => (
              <button key={ph} type="button" onClick={() => insert(ph)} className="rounded-lg bg-page px-2 py-1 text-xs text-navy-800 ring-1 ring-slate-200 hover:ring-gold-400">{ph}</button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{t.poaT.placeholdersHint}</p>
        </div>
        {preview ? (
          <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-page p-4 font-sans text-sm leading-8 text-slate-800 ring-1 ring-slate-200" dir="rtl">{fillPoa(text, { settings })}</pre>
        ) : (
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => { setText(e.target.value); setStatus("idle"); }}
            rows={18}
            dir="rtl"
            className="input min-h-[360px] font-sans text-sm leading-8"
            aria-label={kind === "client" ? t.poaT.clientTitle : t.poaT.accountantTitle}
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={!dirty} onClick={() => { onSave(text.trim()); setStatus("saved"); }} className="btn-navy disabled:opacity-50">
            <Icon name="check" className="h-4 w-4" /> {t.poaT.save}
          </button>
          <button type="button" onClick={() => setPreview(!preview)} className="btn-outline"><Icon name={preview ? "edit" : "eye"} className="h-4 w-4" /> {preview ? t.site.editPage : t.poaT.preview}</button>
          <button type="button" onClick={() => { if (confirm(t.poaT.resetConfirm)) { setText(kind === "client" ? DEFAULT_CLIENT_POA : DEFAULT_ACCOUNTANT_POA); setStatus("idle"); setPreview(false); } }} className="text-xs text-slate-500 underline hover:text-navy-800">
            {t.poaT.reset}
          </button>
          <span className="ms-auto text-xs">
            {status === "saved" && !dirty ? <span className="text-emerald-700">✓ {t.poaT.saved}</span> : dirty ? <span className="text-amber-600">● {t.poaT.unsaved}</span> : null}
            <span className="ms-2 text-slate-400"><span className="ltr-num">{text.length}</span> {t.poaT.chars}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
