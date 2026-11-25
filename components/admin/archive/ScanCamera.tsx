"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/components/store/I18n";

/** تحسين الصورة كمستند: تدرج رمادي + تباين عالٍ + تبييض الخلفية */
export function enhanceCanvas(src: HTMLCanvasElement) {
  const ctx = src.getContext("2d")!;
  const img = ctx.getImageData(0, 0, src.width, src.height);
  const p = img.data;
  // حساب أفتح وأغمق قيمة (تجاهل 2% من الأطراف) لتمديد التباين
  const hist = new Uint32Array(256);
  for (let i = 0; i < p.length; i += 4) hist[(p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) | 0]++;
  const total = p.length / 4;
  let lo = 0, hi = 255, acc = 0;
  for (; lo < 255 && (acc += hist[lo]) < total * 0.02; lo++);
  acc = 0;
  for (; hi > 0 && (acc += hist[hi]) < total * 0.08; hi--);
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < p.length; i += 4) {
    const g = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
    let v = ((g - lo) / range) * 255;
    v = v > 200 ? 255 : v < 0 ? 0 : v; // الخلفية بيضاء
    v = 255 * Math.pow(v / 255, 1.4); // نص أغمق
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
}

const toFile = (c: HTMLCanvasElement, name: string) =>
  new Promise<File>((res, rej) => c.toBlob((b) => (b ? res(new File([b], name, { type: "image/jpeg" })) : rej(new Error("blob"))), "image/jpeg", 0.88));

/** تصوير ورقة بكاميرا الموبايل أو الويب كام، مع معاينة وتحسين */
export default function ScanCamera({ onDone, onCancel }: { onDone: (f: File) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const shot = useRef<HTMLCanvasElement>(null);
  const raw = useRef<HTMLCanvasElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState(false);
  const [enhance, setEnhance] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 2480 }, height: { ideal: 3508 } }, audio: false });
        if (!alive) return st.getTracks().forEach((x) => x.stop());
        stream.current = st;
        if (video.current) {
          video.current.srcObject = st;
          await video.current.play().catch(() => {});
        }
      } catch {
        setErr(true);
      }
    })();
    return () => {
      alive = false;
      stream.current?.getTracks().forEach((x) => x.stop());
    };
  }, []);

  function render(useEnhance: boolean) {
    const r = raw.current, c = shot.current;
    if (!r || !c) return;
    c.width = r.width;
    c.height = r.height;
    c.getContext("2d")!.drawImage(r, 0, 0);
    if (useEnhance) enhanceCanvas(c);
  }

  function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, 2000 / Math.max(v.videoWidth, v.videoHeight));
    const r = document.createElement("canvas");
    r.width = Math.round(v.videoWidth * scale);
    r.height = Math.round(v.videoHeight * scale);
    r.getContext("2d")!.drawImage(v, 0, 0, r.width, r.height);
    raw.current = r;
    setCaptured(true);
    requestAnimationFrame(() => render(enhance));
  }

  async function use() {
    if (!shot.current) return;
    const f = await toFile(shot.current, `scan-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg`);
    stream.current?.getTracks().forEach((x) => x.stop());
    onDone(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-3 sm:p-6" role="dialog" aria-modal>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2 font-semibold"><Icon name="camera" className="h-5 w-5 text-gold-400" /> {t.arch.scan}</span>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-white/10" aria-label={t.ops.cancel}><Icon name="close" /></button>
        </div>
        <div className="relative grid flex-1 place-items-center overflow-hidden rounded-2xl bg-black">
          {err ? (
            <p className="p-6 text-center text-sm text-white/80">{t.arch.cameraError}</p>
          ) : (
            <>
              <video ref={video} playsInline muted className={`max-h-full max-w-full ${captured ? "hidden" : ""}`} />
              <canvas ref={shot} className={`max-h-full max-w-full bg-white object-contain ${captured ? "" : "hidden"}`} />
              {!captured && <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-gold-400/70" />}
            </>
          )}
        </div>
        {!err && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!captured ? (
              <button onClick={capture} className="btn-gold px-8 py-3 text-base"><Icon name="camera" className="h-5 w-5" /> {t.arch.capture}</button>
            ) : (
              <>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white">
                  <input type="checkbox" checked={enhance} onChange={(e) => { setEnhance(e.target.checked); render(e.target.checked); }} className="accent-[#c7a45b]" />
                  <Icon name="wand" className="h-4 w-4 text-gold-300" /> {t.arch.enhance}
                </label>
                <button onClick={() => setCaptured(false)} className="btn-ghost-light">{t.arch.retake}</button>
                <button onClick={use} className="btn-gold">✓ {t.arch.usePhoto}</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
