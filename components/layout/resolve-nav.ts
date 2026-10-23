import 'server-only';
import { l } from '@/lib/i18n/localize';
import type { NavItem } from '@/types/content';
import type { NavLink } from './nav-types';

export function resolveNav(items: NavItem[], locale: string, viewAllLabels: Record<string, string> = {}): NavLink[] {
  return items.map((item) => ({
    id: item.id,
    label: l(item.label, locale) ?? '',
    href: item.href,
    description: l(item.description, locale) ?? null,
    icon: item.icon,
    flag: item.flag ?? null,
    children: item.children ? resolveNav(item.children, locale) : [],
    viewAll: item.href && item.children?.length ? (viewAllLabels[item.id] ?? null) : null,
  }));
}
