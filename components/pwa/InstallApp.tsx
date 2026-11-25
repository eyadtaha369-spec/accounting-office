"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import type { Dict } from "@/lib/i18n";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window { __bip?: BIP }
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** زر «تثبيت التطبيق على الهاتف»: نافذة التثبيت على أندرويد، وتعليمات على آيفون، ويختفي بعد التثبيت */
export default function InstallApp({ t, variant = "light" }: { t: Dict; variant?: "light" | "dark" | "sidebar" }) {
  const [mode, setMode] = useState<"none" | "prompt" | "ios">("none");
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const sync = () => setMode(window.__bip ? "prompt" : isIOS() ? "ios" : "none");
    sync();
    const installed = () => { window.__bip = undefined; setMode("none"); };
    window.addEventListener("bip-ready", sync);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("bip-ready", sync); window.removeEventListener("appinstalled", installed); };
  }, []);

  if (mode === "none") return null;

  async function install() {
    if (mode === "ios") return setHelp(true);
    const e = window.__bip;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === "accepted") { window.__bip = undefined; setMode("none"); }
  }

  const cls =
    variant === "dark"
      ? "inline-flex items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/20"
      : variant === "sidebar"
        ? "flex w-full items-center gap-2 rounded-xl bg-gold-500/15 px-3 py-2.5 text-sm font-semibold text-gold-300 hover:bg-gold-500/25"
        : "inline-flex items-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-sm font-semibold text-gold-300 hover:bg-navy-800";

  return (
    <>
      <button type="button" onClick={install} className={cls}>
        <Icon name="download" className="h-4 w-4" /> {t.pwa.install}
      </button>
      {help && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setHelp(false)} role="dialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
              <div>
                <h3 className="font-bold text-navy-900">{t.pwa.iosTitle}</h3>
                <p className="text-xs text-slate-500">{t.pwa.iosSafari}</p>
              </div>
            </div>
            <ol className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">1</span>
                <span>{t.pwa.iosStep1} <ShareIcon /></span></li>
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">2</span>
                <span>{t.pwa.iosStep2} <b>«{t.pwa.addToHome}»</b> <span className="inline-grid h-5 w-5 place-items-center rounded border border-slate-400 align-middle text-xs">＋</span></span></li>
              <li className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-gold-300">3</span>
                <span>{t.pwa.iosStep3}</span></li>
            </ol>
            <button onClick={() => setHelp(false)} className="btn-navy mt-6 w-full">{t.pwa.gotIt}</button>
          </div>
        </div>
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-middle text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
