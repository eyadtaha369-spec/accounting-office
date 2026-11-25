import {
  Lock, Clock, Award, Activity, Building2, Receipt, Cpu, Search, BookOpen, ShieldCheck, User, List, Upload,
  CircleCheck, Plus, LayoutGrid, Users, Phone, Mail, MapPin, ExternalLink, FileText, LogOut, Percent, Landmark,
  Briefcase, Lightbulb, ClipboardList, CalendarClock, Wallet, FolderArchive, FileSpreadsheet, Menu, X, Trash2,
  Pencil, Download, TrendingUp, TrendingDown, AlertTriangle, Eye, EyeOff, Camera, FolderOpen, FolderPlus, Wand2, MessageCircle, type LucideIcon,
} from "lucide-react";

export const icons = {
  lock: Lock, clock: Clock, badge: Award, pulse: Activity, building: Building2, receipt: Receipt, chip: Cpu,
  search: Search, book: BookOpen, shield: ShieldCheck, user: User, list: List, upload: Upload, check: CircleCheck,
  plus: Plus, grid: LayoutGrid, users: Users, phone: Phone, mail: Mail, pin: MapPin, external: ExternalLink,
  file: FileText, logout: LogOut, percent: Percent, landmark: Landmark, briefcase: Briefcase, bulb: Lightbulb,
  records: ClipboardList, tasks: CalendarClock, wallet: Wallet, archive: FolderArchive, report: FileSpreadsheet,
  menu: Menu, close: X, trash: Trash2, edit: Pencil, download: Download, up: TrendingUp, down: TrendingDown, alert: AlertTriangle,
  eye: Eye, eyeOff: EyeOff, camera: Camera, folder: FolderOpen, folderPlus: FolderPlus, wand: Wand2, chat: MessageCircle,
} satisfies Record<string, LucideIcon>;

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof icons; className?: string }) {
  const C = icons[name];
  return <C className={`shrink-0 ${className}`} strokeWidth={1.8} aria-hidden />;
}
