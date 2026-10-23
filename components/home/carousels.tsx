'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Play, Quote, Star } from 'lucide-react';
import { Modal } from '@/components/sx/modal';
import { Reveal } from '@/components/sx/reveal';
import { SmartImage } from '@/components/sx/smart-image';
import { useSnapCarousel } from '@/components/sx/use-snap-carousel';

export type Story = {
  id: string;
  name: string;
  meta: string;
  country: string | null;
  image: string | null;
  quote: string;
  rating: number | null;
  isPlaceholder: boolean;
};

export type CarouselLabels = {
  previous: string;
  next: string;
  goToSlide: string;
  successStoryOf: string;
  successStory: string;
  watchStory: string;
  ratingLabel: string;
  close: string;
};

type DotsProps = { index: number; count: number; go: (i: number) => void; label: string };

function Dots({ index, count, go, label }: DotsProps) {
  return (
    <div className="dots">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          className={`dot ${i === index ? 'is-active' : ''}`}
          onClick={() => go(i)}
          aria-label={label.replace('{n}', String(i + 1))}
          aria-current={i === index || undefined}
        />
      ))}
    </div>
  );
}

const Todo = ({ show }: { show: boolean }) => (show ? <span className="todo-badge">TODO</span> : null);
const place = (s: Story, sep: string) => (s.country ? `${s.meta}${sep}${s.country}` : s.meta);

export function StoriesCarousel({ stories, labels, heading }: { stories: Story[]; labels: CarouselLabels; heading: React.ReactNode }) {
  const { track, index, go, count } = useSnapCarousel(stories.length);
  const [story, setStory] = useState<Story | null>(null);

  return (
    <>
      <div className="stories-head">
        {heading}
        <div className="carousel-nav">
          <button type="button" onClick={() => go(index - 1)} aria-label={labels.previous}><ChevronLeft size={20} /></button>
          <button type="button" onClick={() => go(index + 1)} aria-label={labels.next}><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="story-track" ref={track}>
        {stories.map((s) => (
          <button
            key={s.id}
            type="button"
            className="story-card"
            onClick={() => setStory(s)}
            aria-label={labels.watchStory.replace('{name}', s.name)}
          >
            <SmartImage src={s.image ?? ''} alt="" fill sizes="(max-width: 640px) 78vw, 300px" />
            <span className="story-shade" />
            <span className="story-play"><Play size={22} fill="currentColor" aria-hidden /></span>
            <span className="story-info">
              <small>{labels.successStoryOf}</small>
              <strong>{s.name}<Todo show={s.isPlaceholder} /></strong>
              <span><MapPin size={13} aria-hidden /> {place(s, ', ')}</span>
            </span>
          </button>
        ))}
      </div>
      <Dots index={index} count={count} go={go} label={labels.goToSlide} />

      <Modal open={!!story} onClose={() => setStory(null)} label={labels.successStory} closeLabel={labels.close} wide>
        {story && (
          <div className="story-modal">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
              <SmartImage src={story.image ?? ''} alt={story.name} fill sizes="(max-width: 860px) 100vw, 380px" className="object-cover" />
            </div>
            <div>
              <span className="eyebrow">{labels.successStory}</span>
              <h3>{story.name}</h3>
              <p className="muted">{place(story, ' · ')}</p>
              <blockquote>
                <Quote size={28} aria-hidden />
                {story.quote}
              </blockquote>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function ReviewsCarousel({ reviews, labels }: { reviews: Story[]; labels: CarouselLabels }) {
  const { track, index, go, count } = useSnapCarousel(reviews.length);
  return (
    <>
      <Reveal>
        <div className="testi-track" ref={track}>
          {reviews.map((t) => (
            <article key={t.id} className="testi-card">
              <Quote className="testi-quote" size={40} aria-hidden />
              <div className="testi-head">
                {t.image ? (
                  <SmartImage src={t.image} alt="" width={56} height={56} className="avatar" />
                ) : (
                  <span className="avatar img-fallback" />
                )}
                <div>
                  <strong>{t.name}<Todo show={t.isPlaceholder} /></strong>
                  <span>{t.meta}</span>
                </div>
              </div>
              {t.rating ? (
                <div className="stars" role="img" aria-label={labels.ratingLabel.replace('{n}', String(t.rating))}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" aria-hidden />)}
                </div>
              ) : null}
              <p>{t.quote}</p>
            </article>
          ))}
        </div>
      </Reveal>
      <div className="testi-foot">
        <button type="button" className="round-btn" onClick={() => go(index - 1)} aria-label={labels.previous}><ChevronLeft size={20} /></button>
        <Dots index={index} count={count} go={go} label={labels.goToSlide} />
        <button type="button" className="round-btn" onClick={() => go(index + 1)} aria-label={labels.next}><ChevronRight size={20} /></button>
      </div>
    </>
  );
}
