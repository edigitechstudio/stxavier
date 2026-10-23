import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Page not found | St. Xavier Educational Network',
  robots: { index: false },
};

/** Fallback for URLs that match no route at all (localized 404s live in app/[locale]/not-found.tsx). */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-white p-6 text-center font-sans text-[#0d1b2a]">
        <div>
          <p className="text-8xl font-extrabold text-[#0061a5]/20">404</p>
          <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t find that page</h1>
          <Link href="/en" className="mt-6 inline-block rounded-full bg-[#0061a5] px-6 py-3 font-semibold text-white">
            Go to homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
