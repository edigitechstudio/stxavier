import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';
import { DestinationsMap } from '@/components/home/destinations-map';
import { ReviewsCarousel, StoriesCarousel, type CarouselLabels, type Story } from '@/components/home/carousels';
import { CtaBanner, Edge, Essentials, Partners, Process, WhyChoose } from '@/components/home/feature-sections';
import { FaqList } from '@/components/home/faq-list';
import { Hero } from '@/components/home/hero';
import { EventsStrip } from '@/components/home/events-strip';
import { TeamStrip, ToolsTeaser } from '@/components/home/home-extras';
import { GoogleReviewsSection } from '@/components/trust/google-reviews';
import { IntakeCountdown } from '@/components/home/intake-countdown';
import { Intro, Services } from '@/components/home/intro-services';
import { JsonLd } from '@/components/seo/json-ld';
import { Reveal } from '@/components/sx/reveal';
import { SectionHead } from '@/components/sx/section-head';
import { SmartImage } from '@/components/sx/smart-image';
import {
  getCounsellors,
  getDestinations,
  getNavigation,
  getFaqs,
  getFeatures,
  getHomeContent,
  getPartners,
  getServices,
  getSiteSettings,
  getTestimonials,
} from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { faqSchema, speakableWebPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';
import type { Locale, Testimonial } from '@/types/content';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getTranslations('home');
  return pageMetadata({
    locale,
    path: '/',
    title: `${t('metaTitle')} | St. Xavier`,
    absoluteTitle: true,
    description: t('metaDescription'),
  });
}

const toStory = (x: Testimonial, locale: Locale): Story => ({
  id: x.id,
  name: x.name,
  meta: l(x.meta, locale) ?? '',
  country: x.country,
  image: x.image,
  quote: l(x.quote, locale) ?? '',
  rating: x.rating,
  isPlaceholder: x.is_placeholder,
});

export default async function HomePage() {
  const locale = await currentLocale();
  const [t, tc, tCommon, tp, format, home, site, destinations, services, edge, why, process, essentials, stories, reviews, partners, faqs, team, nav] =
    await Promise.all([
      getTranslations('home'),
      getTranslations('counselling'),
      getTranslations('common'),
      getTranslations('pages'),
      getFormatter(),
      getHomeContent(),
      getSiteSettings(),
      getDestinations(),
      getServices(),
      getFeatures('edge'),
      getFeatures('why'),
      getFeatures('process'),
      getFeatures('essentials'),
      getTestimonials('story'),
      getTestimonials('review'),
      getPartners(),
      getFaqs('home'),
      getCounsellors(),
      getNavigation('header'),
    ]);
  const tools = nav.find((n) => n.id === 'tools')?.children ?? [];
  const intake = site.next_intake;

  const carouselLabels: CarouselLabels = {
    previous: t('previous'),
    next: t('next'),
    goToSlide: t.raw('goToSlide'),
    successStoryOf: t('successStoryOf'),
    successStory: t('successStory'),
    watchStory: t.raw('watchStory'),
    ratingLabel: t.raw('ratingLabel'),
    close: tc('close'),
  };
  const faqItems = faqs.map((f) => ({ id: f.id, question: l(f.question, locale) ?? '', answer: l(f.answer, locale) ?? '' }));

  return (
    <>
      <Hero home={home} destinations={destinations} locale={locale} />
      <Intro home={home} locale={locale} />
      <Services home={home} services={services} locale={locale} learnMore={tCommon('learnMore')} />

      {destinations.length > 0 && (
        <section className="destinations" id="destinations">
          <div className="wrap">
            <SectionHead
              light
              eyebrow={l(home.destinations.eyebrow, locale)}
              title={l(home.destinations.title, locale) ?? ''}
              sub={l(home.destinations.subtitle, locale)}
            />
            <DestinationsMap
              labels={{ studyIn: t.raw('studyIn'), learnMore: tCommon('learnMore'), list: t('destinationsList') }}
              destinations={destinations.map((d) => ({
                slug: d.slug,
                iso2: d.iso2,
                iso3: d.iso3,
                name: l(d.name, locale) ?? d.slug,
                summary: l(d.summary, locale) ?? '',
                image: d.hero_image,
                badge: l(d.badge, locale) ?? null,
                lat: d.lat,
                lng: d.lng,
              }))}
            />
          </div>
        </section>
      )}

      <Edge heading={home.edge} items={edge} locale={locale} />
      <WhyChoose heading={home.why} items={why} locale={locale} />
      <ToolsTeaser heading={home.tools} tools={tools} locale={locale} />

      {stories.length > 0 && (
        <section className="stories">
          <div className="wrap">
            <StoriesCarousel
              stories={stories.map((s) => toStory(s, locale))}
              labels={carouselLabels}
              heading={<SectionHead light align="left" eyebrow={l(home.stories.eyebrow, locale)} title={l(home.stories.title, locale) ?? ''} />}
            />
          </div>
        </section>
      )}

      <Process heading={home.process} items={process} locale={locale} />

      {intake && (
        <div className="wrap pb-[clamp(48px,7vw,90px)]">
          <IntakeCountdown
            deadline={intake.deadline}
            intakeLabel={l(intake.label, locale) ?? ''}
            dateLabel={format.dateTime(new Date(`${intake.deadline}T12:00:00+05:45`), { dateStyle: 'long' })}
            labels={{
              title: l(home.countdown.title, locale) ?? '',
              body: l(home.countdown.body, locale) ?? '',
              cta: l(home.countdown.cta, locale) ?? '',
              days: t('days'),
              hours: t('hours'),
              minutes: t('minutes'),
              closesOn: t.raw('closesOn'),
              closed: t('closed'),
            }}
          />
        </div>
      )}

      {reviews.length > 0 && (
        <section className="section testimonials">
          <div className="wrap">
            <SectionHead eyebrow={l(home.testimonials.eyebrow, locale)} title={l(home.testimonials.title, locale) ?? ''} />
            <ReviewsCarousel reviews={reviews.map((r) => toStory(r, locale))} labels={carouselLabels} />
          </div>
        </section>
      )}

      <GoogleReviewsSection locale={locale} />
      <TeamStrip
        heading={home.team}
        team={team}
        locale={locale}
        labels={{ experience: tp.raw('experience'), book: tp.raw('book'), viewProfile: tp('viewProfile') }}
      />
      <EventsStrip heading={home.events} locale={locale} />
      <CtaBanner home={home} locale={locale} />
      <Essentials heading={home.essentials} items={essentials} locale={locale} detailsLabel={(title) => t('details', { title })} />
      <Partners heading={home.partners} partners={partners} locale={locale} />

      {faqItems.length > 0 && (
        <section className="section faq">
          <div className="wrap faq-layout">
            <div>
              <SectionHead
                align="left"
                eyebrow={l(home.faq.eyebrow, locale)}
                title={l(home.faq.title, locale) ?? ''}
                sub={l(home.faq.subtitle, locale)}
              />
              <Reveal className="faq-aside">
                <SmartImage src={home.faq.image} alt="" fill sizes="480px" />
                <div className="faq-aside-card">
                  <strong>{l(home.faq.aside_title, locale)}</strong>
                  <span>{l(home.faq.aside_body, locale)}</span>
                </div>
              </Reveal>
            </div>
            <FaqList items={faqItems} />
          </div>
          <JsonLd data={faqSchema(faqs, locale)} />
        </section>
      )}

      <JsonLd
        data={speakableWebPageSchema({
          name: `${t('metaTitle')} | ${site.name}`,
          url: absoluteUrl(locale, '/'),
          dateModified: site.updated_at,
        })}
      />
    </>
  );
}
