'use client';
import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Play, Quote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/brand/flag';
import { useQuerySync } from '@/components/tools/shared';
import { Modal } from '@/components/sx/modal';
import { SmartImage } from '@/components/sx/smart-image';

export type WallStory = {
  id: string;
  name: string;
  university: string;
  destination: string | null;
  countryName: string;
  iso2: string | null;
  intake: string | null;
  image: string | null;
  quote: string;
  story: string;
  video: string | null;
  isPlaceholder: boolean;
};

function StoryModal({ story, onClose }: { story: WallStory | null; onClose: () => void }) {
  const t = useTranslations('trust.stories');
  const tc = useTranslations('counselling');
  return (
    <Modal open={!!story} onClose={onClose} label={story?.name ?? ''} closeLabel={tc('close')} wide>
      {story && (
        <div className="story-modal">
          {story.video ? (
            <video className="story-video" src={story.video} poster={story.image ?? undefined} controls autoPlay playsInline preload="metadata" />
          ) : (
            <div className="relative aspect-[3/4] overflow-hidden rounded-[18px]">
              <SmartImage src={story.image ?? ''} alt={story.name} fill sizes="380px" className="object-cover" />
            </div>
          )}
          <div>
            <span className="eyebrow">{t('wall')}</span>
            <h3>
              {story.name}
              {story.isPlaceholder && <span className="todo-badge">TODO</span>}
            </h3>
            <p className="muted">
              {story.university} · {story.countryName}
              {story.intake ? ` · ${t('intake')} ${story.intake}` : ''}
            </p>
            <blockquote>
              <Quote size={28} aria-hidden />
              {story.story || story.quote}
            </blockquote>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** 9:16 reels: play muted on hover (pointer devices) or when mostly in view (touch). Lazy: no preload. */
function Reel({ story, onOpen }: { story: WallStory; onOpen: () => void }) {
  const t = useTranslations('trust.stories');
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver(([e]) => (e.intersectionRatio > 0.7 ? v.play().catch(() => {}) : v.pause()), { threshold: [0, 0.7, 1] });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <button
      type="button"
      className="reel"
      onClick={onOpen}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => ref.current?.pause()}
      aria-label={`${t('watch')}: ${story.name}`}
    >
      <video ref={ref} src={story.video ?? undefined} poster={story.image ?? undefined} muted loop playsInline preload="none" aria-hidden />
      <span className="reel-badge"><Play size={11} fill="currentColor" aria-hidden /> {t('watch')}</span>
      <span className="reel-info">
        <strong>{story.name}</strong>
        <span>{story.university}</span>
      </span>
    </button>
  );
}

export function StoryReels({ stories }: { stories: WallStory[] }) {
  const [open, setOpen] = useState<WallStory | null>(null);
  const withVideo = stories.filter((s) => s.video);
  if (!withVideo.length) return null;
  return (
    <>
      <div className="reels">
        {withVideo.map((s) => <Reel key={s.id} story={s} onOpen={() => setOpen(s)} />)}
      </div>
      <StoryModal story={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function SuccessWall({ stories }: { stories: WallStory[] }) {
  const t = useTranslations('trust.stories');
  const [country, setCountry] = useState('');
  const [open, setOpen] = useState<WallStory | null>(null);
  useQuerySync((q) => setCountry(q.get('country') ?? ''), { country: country || undefined });

  const countries = [...new Map(stories.filter((s) => s.destination).map((s) => [s.destination!, s])).values()];
  const shown = country ? stories.filter((s) => s.destination === country) : stories;

  if (!stories.length) return <p className="answer">{t('empty')}</p>;
  return (
    <>
      <div className="chip-toggles mb-6" role="group" aria-label={t('filter')}>
        <button type="button" className="chip-toggle" aria-pressed={!country} onClick={() => setCountry('')}>{t('all')}</button>
        {countries.map((s) => (
          <button key={s.destination} type="button" className="chip-toggle" aria-pressed={country === s.destination} onClick={() => setCountry(s.destination!)}>
            {s.iso2 && <Flag code={s.iso2} />} {s.countryName}
          </button>
        ))}
      </div>
      <p className="result-count" role="status">{t('count', { n: shown.length })}</p>
      <div className="wall">
        {shown.map((s) => (
          <button key={s.id} type="button" className="wall-card" onClick={() => setOpen(s)} aria-label={`${t('readStory')}: ${s.name}`}>
            <span className="wall-photo block">
              <SmartImage src={s.image ?? ''} alt="" fill sizes="(max-width: 700px) 100vw, 380px" />
              <span className="wall-visa"><BadgeCheck size={14} aria-hidden /> Visa ✓</span>
              {s.video && <span className="wall-play"><Play size={16} fill="currentColor" aria-hidden /></span>}
            </span>
            <span className="wall-body">
              <strong>
                {s.name}
                {s.isPlaceholder && <span className="todo-badge">TODO</span>}
              </strong>
              <span>{s.iso2 && <Flag code={s.iso2} className="mr-1.5 h-3 w-[18px]" />}{s.university}{s.intake ? ` · ${s.intake}` : ''}</span>
              <p>“{s.quote}”</p>
            </span>
          </button>
        ))}
      </div>
      <StoryModal story={open} onClose={() => setOpen(null)} />
    </>
  );
}
