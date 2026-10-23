import {
  ArrowLeftRight, BadgeCheck, BedDouble, CalendarCheck, Compass, FileText, Globe, Globe2, Layers, MessageCircle, PenLine, ShieldCheck, Target, UserCheck, Wallet,
  Award, BookOpenCheck, Building2, Calculator, CalendarDays, CalendarRange, CircleHelp, ClipboardCheck,
  Columns3, FileCheck2, Gauge, GraduationCap, HeartHandshake, Landmark, Languages, ListChecks,
  MonitorCheck, Newspaper, Percent, Plane, School, Stamp, Trophy, Users, Circle, type LucideIcon,
} from 'lucide-react';

/**
 * Icons referenced by name from CMS content. Explicit map keeps the bundle tree-shaken;
 * add an entry here when editors need a new icon.
 */
const registry: Record<string, LucideIcon> = {
  ArrowLeftRight, BadgeCheck, BedDouble, CalendarCheck, Compass, FileText, Globe, Globe2, Layers, MessageCircle, PenLine, ShieldCheck, Target, UserCheck, Wallet,
  Award, BookOpenCheck, Building2, Calculator, CalendarDays, CalendarRange, CircleHelp, ClipboardCheck,
  Columns3, FileCheck2, Gauge, GraduationCap, HeartHandshake, Landmark, Languages, ListChecks,
  MonitorCheck, Newspaper, Percent, Plane, School, Stamp, Trophy, Users,
};

export const iconNames = Object.keys(registry);

export function DynamicIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && registry[name]) || Circle;
  return <Icon className={className} aria-hidden />;
}
