import { ArrowRight } from 'lucide-react';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { l } from '@/lib/i18n/localize';
import type { Counsellor, Locale } from '@/types/content';

export type CounsellorCardLabels = { experience: string; book: string; viewProfile: string };

/** `experience` and `book` are message templates containing {n} / {name}. */
export function CounsellorCard({ c, locale, labels }: { c: Counsellor; locale: Locale; labels: CounsellorCardLabels }) {
  const firstName = c.name.split(' ')[0];
  const meta = [c.years_experience ? labels.experience.replace('{n}', String(c.years_experience)) : null, c.languages.join(', ')]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="team-card h-full">
      <div className="team-photo">
        <SmartImage src={c.photo ?? ''} alt={c.name} fill sizes="(max-width: 760px) 100vw, 300px" />
      </div>
      <div className="team-body">
        <h3>
          <Link href={`/team/${c.slug}`}>{c.name}</Link>
          {c.is_placeholder && <span className="todo-badge">TODO</span>}
        </h3>
        <p className="team-role">{l(c.role, locale)}</p>
        <p className="team-meta">{meta}</p>
        <div className="team-actions">
          <Link href={{ pathname: '/book', query: { counsellor: c.slug } }} className="btn btn-primary btn-sm">
            {labels.book.replace('{name}', firstName)}
          </Link>
          <Link href={`/team/${c.slug}`} className="link-arrow">
            {labels.viewProfile} <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
