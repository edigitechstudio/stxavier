import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CounsellingButton } from '@/components/sx/counselling';
import { Highlight } from '@/components/sx/highlight';
import { l } from '@/lib/i18n/localize';
import type { Destination, HomeContent, Locale } from '@/types/content';
import { HeroFx } from './hero-fx';
import { HeroJourney } from './hero-journey';
import { HeroSearch } from './hero-search';

export async function Hero({
  home,
  destinations,
  locale,
}: {
  home: HomeContent;
  destinations: Destination[];
  locale: Locale;
}) {
  const t = await getTranslations('home');
  const h = home.hero;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <Image src={h.image} alt="" fill priority quality={60} sizes="100vw" />
      </div>
      <div className="hero-overlay" />
      <HeroFx />

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="hero-tag">
            <span className="pulse-dot" /> {l(h.tag, locale)}
          </span>
          <h1 id="hero-title">
            <Highlight text={l(h.title, locale) ?? ''} highlight={l(h.highlight, locale)} />
          </h1>
          <p data-speakable>{l(h.subtitle, locale)}</p>
          <div className="hero-ctas">
            <CounsellingButton className="btn btn-primary btn-lg">
              {l(h.primary_cta, locale)} <ArrowRight size={18} aria-hidden />
            </CounsellingButton>
            <CounsellingButton className="btn btn-glass btn-lg">
              <span className="play-chip">
                <Play size={12} fill="currentColor" aria-hidden />
              </span>
              {l(h.secondary_cta, locale)}
            </CounsellingButton>
          </div>
        </div>

        {!!h.journey?.length && (
          <HeroJourney
            label={t('journeyLabel')}
            steps={h.journey.map((s) => ({
              icon: s.icon,
              title: l(s.title, locale) ?? '',
              note: l(s.note, locale) ?? null,
            }))}
          />
        )}
      </div>

      <div className="wrap">
        <HeroSearch
          labels={{
            destination: t('searchDestination'),
            field: t('searchField'),
            intake: t('searchIntake'),
            any: t('any'),
            search: t('search'),
          }}
          options={{
            destinations: destinations.map((d) => l(d.name, locale) ?? d.slug),
            fields: home.search.fields.map((f) => l(f, locale) ?? f.en),
            intakes: home.search.intakes.map((i) => l(i, locale) ?? i.en),
          }}
        />
      </div>
    </section>
  );
}
