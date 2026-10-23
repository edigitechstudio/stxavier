import { ExternalLink, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SectionHead } from '@/components/sx/section-head';
import { SmartImage } from '@/components/sx/smart-image';
import { env } from '@/lib/env';
import { getGoogleReviews } from '@/lib/reviews';

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value.toFixed(1)} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} fill={i < Math.round(value) ? 'currentColor' : 'none'} aria-hidden />
      ))}
    </span>
  );
}

/**
 * Real Google reviews (Places API). Renders nothing in production until the API is configured;
 * in development it shows a short setup notice instead.
 */
export async function GoogleReviewsSection({ locale, withHeading = true }: { locale: string; withHeading?: boolean }) {
  const [data, t] = await Promise.all([getGoogleReviews(locale), getTranslations('trust.reviews')]);

  if (!data) {
    if (env.isProduction) return null;
    return (
      <section className="section">
        <div className="wrap"><p className="dev-notice">{t('devNotice')}</p></div>
      </section>
    );
  }

  return (
    <section className="section" aria-labelledby={withHeading ? 'google-reviews' : undefined}>
      <div className="wrap">
        {withHeading && <SectionHead title={t('title')} id="google-reviews" />}
        <div className="reviews-widget">
          <div className="rating-card">
            <span className="google-g" aria-hidden>
              <span style={{ color: '#4285F4' }}>G</span><span style={{ color: '#EA4335' }}>o</span><span style={{ color: '#FBBC05' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span><span style={{ color: '#34A853' }}>l</span><span style={{ color: '#EA4335' }}>e</span>
            </span>
            <strong>{data.rating.toFixed(1)}</strong>
            <Stars value={data.rating} size={20} />
            <span className="muted text-sm">{t('summary', { rating: data.rating.toFixed(1), count: data.count })}</span>
            {data.url && (
              <a href={data.url} target="_blank" rel="noopener" className="btn btn-outline btn-sm mt-2">
                {t('seeAll')} <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </div>
          <div className="review-list">
            {data.reviews.slice(0, 4).map((r, i) => (
              <article key={i} className="review-card">
                <div className="review-head">
                  {r.photo ? <SmartImage src={r.photo} alt="" width={40} height={40} unoptimized /> : <span className="img-fallback" />}
                  <div>
                    <strong className="block text-[var(--ink)]">{r.authorUrl ? <a href={r.authorUrl} target="_blank" rel="noopener nofollow">{r.author}</a> : r.author}</strong>
                    <span className="muted text-xs">{r.relativeTime}</span>
                  </div>
                </div>
                <Stars value={r.rating} />
                <p>{r.text}</p>
              </article>
            ))}
          </div>
        </div>
        <p className="tool-note text-right">{t('attribution')}</p>
      </div>
    </section>
  );
}
