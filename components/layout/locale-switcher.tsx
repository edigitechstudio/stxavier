'use client';
import { Suspense, useTransition } from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

type Props = { label: string; switchTo: string };

const Content = ({ switchTo, next }: { switchTo: string; next: string }) => (
  <>
    <Languages size={17} aria-hidden />
    <span className="lang-label">{switchTo}</span>
    <span className="sr-only">{next}</span>
  </>
);

function PathAwareSwitcher({ label, switchTo }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === 'en' ? 'ne' : 'en';
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`${label}: ${switchTo}`}
      disabled={pending}
      lang={next}
      onClick={() => startTransition(() => router.replace(pathname, { locale: next }))}
    >
      <Content switchTo={switchTo} next={next} />
    </button>
  );
}

/** Before the pathname is known (prerender), fall back to a plain link to the other locale's home. */
function FallbackSwitcher({ label, switchTo }: Props) {
  const next = useLocale() === 'en' ? 'ne' : 'en';
  return (
    <a href={`/${next}`} className="icon-btn" aria-label={`${label}: ${switchTo}`} lang={next}>
      <Content switchTo={switchTo} next={next} />
    </a>
  );
}

export function LocaleSwitcher(props: Props) {
  return (
    <Suspense fallback={<FallbackSwitcher {...props} />}>
      <PathAwareSwitcher {...props} />
    </Suspense>
  );
}
