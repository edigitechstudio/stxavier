import { Reveal } from './reveal';

type Props = {
  eyebrow?: string | null;
  title: string;
  sub?: string | null;
  light?: boolean;
  align?: 'center' | 'left';
  id?: string;
};

export function SectionHead({ eyebrow, title, sub, light = false, align = 'center', id }: Props) {
  return (
    <Reveal className={`section-head ${light ? 'is-light' : ''} align-${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="section-title" id={id}>{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </Reveal>
  );
}
