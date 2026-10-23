/** Locale-resolved menu item passed from server to client components. */
export type NavLink = {
  id: string;
  label: string;
  href: string | null;
  description: string | null;
  icon: string | null;
  flag: string | null;
  children: NavLink[];
  /** Label for the "view all" link inside a mega-menu panel, if any. */
  viewAll: string | null;
};
