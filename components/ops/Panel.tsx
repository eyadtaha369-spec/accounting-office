export function Panel({ title, action, children, hint }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-bold text-navy-900">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="p-10 text-center text-sm text-slate-500">{text}</p>;
}

export function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>;
}
