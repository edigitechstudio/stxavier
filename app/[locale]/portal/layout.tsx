import type { Metadata } from 'next';

// Private, per-user pages: they read the session at request time, so they block on the server
// instead of being validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PortalLayout({ children }: LayoutProps<'/[locale]/portal'>) {
  return <div className="portal-page">{children}</div>;
}
