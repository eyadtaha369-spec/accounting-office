const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const icons = {
  lock: <svg viewBox="0 0 24 24" {...P}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>,
  clock: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  badge: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="9" r="6" /><path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" /></svg>,
  pulse: <svg viewBox="0 0 24 24" {...P}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>,
  building: <svg viewBox="0 0 24 24" {...P}><path d="M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M3 21h18M8 7h4M8 11h4M8 15h4" /></svg>,
  receipt: <svg viewBox="0 0 24 24" {...P}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>,
  chip: <svg viewBox="0 0 24 24" {...P}><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></svg>,
  search: <svg viewBox="0 0 24 24" {...P}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>,
  book: <svg viewBox="0 0 24 24" {...P}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M4 19a2 2 0 002 2h13" /><path d="M9 7h6" /></svg>,
  shield: <svg viewBox="0 0 24 24" {...P}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  user: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>,
  list: <svg viewBox="0 0 24 24" {...P}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>,
  upload: <svg viewBox="0 0 24 24" {...P}><path d="M12 16V4M7 9l5-5 5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>,
  check: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>,
  plus: <svg viewBox="0 0 24 24" {...P}><path d="M12 5v14M5 12h14" /></svg>,
  grid: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  users: <svg viewBox="0 0 24 24" {...P}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 15c2 .6 3.2 2.2 3.5 5" /></svg>,
  phone: <svg viewBox="0 0 24 24" {...P}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>,
  mail: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>,
  pin: <svg viewBox="0 0 24 24" {...P}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  external: <svg viewBox="0 0 24 24" {...P}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>,
  file: <svg viewBox="0 0 24 24" {...P}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /></svg>,
  logout: <svg viewBox="0 0 24 24" {...P}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>,
};

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof icons; className?: string }) {
  return <span className={`inline-block shrink-0 [&>svg]:h-full [&>svg]:w-full ${className}`}>{icons[name]}</span>;
}
