import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '@/components/seo/breadcrumbs';
import { Highlight } from './highlight';
import { SmartImage } from './smart-image';

type Props = {
  crumbs: Crumb[];
  title: string;
  highlight?: string | null;
  eyebrow?: string | null;
  subtitle?: string | null;
  image?: string | null;
  /** Extra content under the subtitle (buttons, flag, meta). */
  children?: ReactNode;
};

/** Navy banner used at the top of every inner page: breadcrumbs, H1 with red accent, subtitle. */
export function PageHero({ crumbs, title, highlight, eyebrow, subtitle, image, children }: Props) {
  return (
    <section className={`page-hero ${image ? 'has-image' : ''}`}>
      {image && (
        <div className="page-hero-media">
          <SmartImage src={image} alt="" fill priority quality={60} sizes="100vw" />
        </div>
      )}
      <div className="wrap page-hero-inner">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>
          <Highlight text={title} highlight={highlight} />
        </h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
