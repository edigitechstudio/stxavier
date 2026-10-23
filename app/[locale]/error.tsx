'use client';
import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page flex flex-col items-center py-28 text-center">
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="text-muted-foreground mt-3 max-w-md">{t('body')}</p>
      <Button onClick={reset} size="lg" className="mt-8 h-11 rounded-full px-6">
        <RotateCcw /> {t('retry')}
      </Button>
    </section>
  );
}
