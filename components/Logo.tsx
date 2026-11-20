import Link from "next/link";

export default function Logo({ name, tag, light = false }: { name: string; tag?: string; light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-navy-950" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block text-sm font-bold sm:text-base ${light ? "text-white" : "text-navy-900"}`}>{name}</span>
        {tag && <span className={`hidden text-xs sm:block ${light ? "text-gold-300" : "text-slate-500"}`}>{tag}</span>}
      </span>
    </Link>
  );
}
