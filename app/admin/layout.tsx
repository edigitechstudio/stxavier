import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { env } from '@/lib/env';
import { jakarta, serif } from '@/lib/fonts';
import '../globals.css';

// Staff-only, per-user pages that read the session at request time.
export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: 'Admin', template: '%s · Admin · St. Xavier' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#0b1f4b' };

/** English-only staff dashboard. Its own root layout: no public header/footer, no locale. */
export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${serif.variable}`}>
      <body className="sx-root admin-root">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
