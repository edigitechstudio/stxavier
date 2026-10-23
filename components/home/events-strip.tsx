import { ArrowRight } from 'lucide-react';
import { SectionHead } from '@/components/sx/section-head';
import { EventCard } from '@/components/trust/event-card';
import { Link } from '@/i18n/navigation';
import { getEventBuckets, toEventCards } from '@/lib/events-view';
import { l } from '@/lib/i18n/localize';
import type { HomeContent, Locale } from '@/types/content';

/** Next three upcoming events/webinars. Renders nothing when the calendar is empty. */
export async function EventsStrip({ heading, locale }: { heading: HomeContent['events']; locale: Locale }) {
  const { upcoming, isPast } = await getEventBuckets();
  if (!upcoming.length) return null;
  const cards = await toEventCards(upcoming.slice(0, 3), isPast, locale);
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead eyebrow={l(heading.eyebrow, locale)} title={l(heading.title, locale) ?? ''} sub={l(heading.subtitle, locale)} />
        <div className="event-list mx-auto max-w-[900px]">{cards.map((e) => <EventCard key={e.slug} e={e} />)}</div>
        <div className="center">
          <Link href="/events" className="btn btn-dark">{l(heading.cta, locale)} <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </div>
    </section>
  );
}
