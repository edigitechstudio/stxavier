import { CalendarDays, Clock } from 'lucide-react';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';

export type PostCardData = {
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  topic: string;
  topicLabel: string;
  dateLabel: string;
  date: string;
  readLabel: string;
  countries: string[];
  needsReview: boolean;
};

export function PostCard({ post, headingLevel = 'h3' }: { post: PostCardData; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  return (
    <Link href={`/blog/${post.slug}`} className="post-card h-full">
      <div className="post-cover">
        <SmartImage src={post.cover ?? ''} alt="" fill sizes="(max-width: 760px) 100vw, 380px" />
      </div>
      <div className="post-body">
        <span className="post-topic">{post.topicLabel}</span>
        <H>
          {post.title}
          {post.needsReview && <span className="todo-badge">TODO</span>}
        </H>
        <p className="text-sm">{post.description}</p>
        <div className="post-meta">
          <span><CalendarDays size={13} aria-hidden /> <time dateTime={post.date}>{post.dateLabel}</time></span>
          <span><Clock size={13} aria-hidden /> {post.readLabel}</span>
        </div>
      </div>
    </Link>
  );
}
