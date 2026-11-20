import { STATUS_DOT, STATUS_STYLES, type Status } from "@/lib/i18n";

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {label}
    </span>
  );
}
