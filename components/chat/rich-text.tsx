import { Fragment } from 'react';
import { Link } from '@/i18n/navigation';
import { parseRich, type Inline } from '@/lib/chat/rich';

function Inlines({ items }: { items: Inline[] }) {
  return items.map((it, i) => {
    if (it.kind === 'bold') return <strong key={i}>{it.text}</strong>;
    if (it.kind === 'link') {
      return it.internal ? (
        <Link key={i} href={it.href}>{it.text}</Link>
      ) : (
        <a key={i} href={it.href} target="_blank" rel="noopener noreferrer">{it.text}</a>
      );
    }
    return <Fragment key={i}>{it.text}</Fragment>;
  });
}

/** Renders assistant text safely (no HTML injection, allow-listed links). */
export function RichText({ text }: { text: string }) {
  return parseRich(text).map((b, i) => {
    if (b.kind === 'p') return <p key={i}><Inlines items={b.inlines} /></p>;
    const List = b.kind;
    return (
      <List key={i}>
        {b.items.map((item, j) => <li key={j}><Inlines items={item} /></li>)}
      </List>
    );
  });
}
