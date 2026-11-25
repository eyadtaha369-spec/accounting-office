"use client";
import { useState } from "react";
import PagesManager from "./PagesManager";
import GeneralSettings from "./GeneralSettings";
import PoaTemplates from "./PoaTemplates";
import { Panel } from "@/components/ops/Panel";
import { useAdmin } from "@/components/store/stores";
import { useI18n } from "@/components/store/I18n";
import { Guard } from "@/components/store/SyncBar";

export default function SiteSettingsView() {
  const s = useAdmin();
  const { t } = useI18n();
  const [tab, setTab] = useState<"pages" | "general" | "poa">(() => (typeof window !== "undefined" && window.location.hash === "#poa" ? "poa" : "pages"));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">⚙️ {t.site.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.site.subtitle}</p>
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {([["pages", t.site.tabPages], ["general", t.site.tabGeneral], ["poa", `📜 ${t.poaT.tab}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${tab === k ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-slate-600 ring-slate-200 hover:ring-navy-600"}`}>
            {label}
          </button>
        ))}
      </div>
      <Guard s={s}>
        {() => (
          <Panel title={tab === "pages" ? `🧩 ${t.site.tabPages}` : tab === "general" ? `🏢 ${t.site.tabGeneral}` : `📜 ${t.poaT.tab}`}>
            {tab === "pages" ? <PagesManager /> : tab === "general" ? <GeneralSettings /> : <PoaTemplates />}
          </Panel>
        )}
      </Guard>
    </div>
  );
}
