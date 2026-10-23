import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Quote, Star, MapPin } from 'lucide-react';
import { studentStories, testimonials } from '../data';
import { Modal, Reveal, SafeImg, SectionHead } from './ui';

/** Scroll-snap carousel state: which slide is first in view, plus prev/next helpers. */
function useSnapCarousel(count) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);

  const step = () => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (!card) return 0;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0);
  };

  const onScroll = useCallback(() => {
    const s = step();
    if (s) setIndex(Math.round(track.current.scrollLeft / s));
  }, []);

  const go = (i) => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: Math.min(Math.max(i, 0) * step(), max), behavior: 'smooth' });
  };

  useEffect(() => {
    const el = track.current;
    el?.addEventListener('scroll', onScroll, { passive: true });
    return () => el?.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return { track, index, go, count };
}

function Dots({ c }) {
  return (
    <div className="dots">
      {Array.from({ length: c.count }).map((_, i) => (
        <button
          key={i}
          className={`dot ${i === c.index ? 'is-active' : ''}`}
          onClick={() => c.go(i)}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function StudentStories() {
  const c = useSnapCarousel(studentStories.length);
  const [story, setStory] = useState(null);

  return (
    <section className="stories">
      <div className="container">
        <div className="stories-head">
          <SectionHead light eyebrow="Students Experiences" title="Our students recount their experiences" align="left" />
          <div className="carousel-nav">
            <button onClick={() => c.go(c.index - 1)} aria-label="Previous"><ChevronLeft size={20} /></button>
            <button onClick={() => c.go(c.index + 1)} aria-label="Next"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="story-track" ref={c.track}>
          {studentStories.map((s) => (
            <button key={s.name} className="story-card" onClick={() => setStory(s)}>
              <SafeImg src={s.image} alt={s.name} />
              <span className="story-shade" />
              <span className="story-play"><Play size={22} fill="currentColor" /></span>
              <span className="story-info">
                <small>The success story of</small>
                <strong>{s.name}</strong>
                <span><MapPin size={13} /> {s.uni}, {s.country}</span>
              </span>
            </button>
          ))}
        </div>
        <Dots c={c} />
      </div>

      <Modal open={!!story} onClose={() => setStory(null)} label="Student story" wide>
        {story && (
          <div className="story-modal">
            <SafeImg src={story.image} alt={story.name} />
            <div>
              <span className="eyebrow">Success Story</span>
              <h3>{story.name}</h3>
              <p className="muted">{story.uni} · {story.country}</p>
              <blockquote>
                <Quote size={28} />
                {story.quote}
              </blockquote>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export function Testimonials() {
  const c = useSnapCarousel(testimonials.length);

  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHead eyebrow="Our Testimonial" title="What students say about our study abroad consultancy" />
        <Reveal>
          <div className="testi-track" ref={c.track}>
            {testimonials.map((t) => (
              <article key={t.name} className="testi-card">
                <Quote className="testi-quote" size={40} />
                <div className="testi-head">
                  <SafeImg src={t.image} alt={t.name} className="avatar" />
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.meta}</span>
                  </div>
                </div>
                <div className="stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p>{t.text}</p>
              </article>
            ))}
          </div>
        </Reveal>
        <div className="testi-foot">
          <button className="round-btn" onClick={() => c.go(c.index - 1)} aria-label="Previous"><ChevronLeft size={20} /></button>
          <Dots c={c} />
          <button className="round-btn" onClick={() => c.go(c.index + 1)} aria-label="Next"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  );
}
