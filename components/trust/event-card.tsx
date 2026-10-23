import { ArrowRight, Clock, MapPin, PlayCircle, Video } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export type EventCardData = {
  slug: string;
  kindLabel: string;
  title: string;
  summary: string;
  day: string;
  month: string;
  time: string;
  place: string;
  online: boolean;
  isPast: boolean;
  hasRecording: boolean;
  isPlaceholder: boolean;
  cta: string;
};

export function EventCard({ e }: { e: EventCardData }) {
  return (
    <Link href={`/events/${e.slug}`} className={`event-card ${e.isPast ? 'is-past' : ''}`}>
      <span className="event-date" aria-hidden>
        <b>{e.day}</b>
        <span>{e.month}</span>
      </span>
      <span className="grid gap-1.5">
        <span className="event-kind">{e.kindLabel}</span>
        <h3>
          {e.title}
          {e.isPlaceholder && <span className="todo-badge">TODO</span>}
        </h3>
        <span className="text-sm">{e.summary}</span>
        <span className="event-meta">
          <span><Clock size={14} aria-hidden /> {e.time}</span>
          <span>{e.online ? <Video size={14} aria-hidden /> : <MapPin size={14} aria-hidden />} {e.place}</span>
          {e.hasRecording && <span><PlayCircle size={14} aria-hidden /> ▶</span>}
        </span>
        <span className="link-arrow">{e.cta} <ArrowRight size={15} aria-hidden /></span>
      </span>
    </Link>
  );
}
