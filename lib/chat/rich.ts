/**
 * Parses the small Markdown subset the assistant may use. Paragraphs, bullet/numbered lists,
 * **bold** and [links](…), into a tree. Nothing is ever rendered as HTML, and only safe link
 * targets survive: site paths, tel:, mailto:, WhatsApp and our own domain.
 */
export type Inline = { kind: 'text'; text: string } | { kind: 'bold'; text: string } | { kind: 'link'; text: string; href: string; internal: boolean };
export type Block = { kind: 'p'; inlines: Inline[] } | { kind: 'ul' | 'ol'; items: Inline[][] };

export function safeHref(href: string): { href: string; internal: boolean } | null {
  const h = href.trim();
  if (/^\/(?!\/)[\w\-/]*(?:#[\w-]*)?(?:\?[\w=&-]*)?$/.test(h)) return { href: h.replace(/^\/(en|ne)(?=\/|$)/, '') || '/', internal: true };
  if (/^tel:\+?[\d\s-]{6,20}$/.test(h) || /^mailto:[^\s@]+@[^\s@]+$/.test(h)) return { href: h, internal: false };
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h)) return { href: h, internal: false };
  const own = /^https:\/\/(?:www\.)?stxavier\.com\.np(\/[\w\-/]*)?$/.exec(h);
  if (own) return { href: (own[1] ?? '/').replace(/^\/(en|ne)(?=\/|$)/, '') || '/', internal: true };
  return null;
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]{1,200})\]\(([^)\s]{1,300})\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: 'bold', text: m[1] });
    else {
      const safe = safeHref(m[3]);
      out.push(safe ? { kind: 'link', text: m[2], ...safe } : { kind: 'text', text: m[2] });
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

export function parseRich(src: string): Block[] {
  const blocks: Block[] = [];
  for (const para of src.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = para.split('\n').filter((x) => x.trim());
    if (!lines.length) continue;
    let i = 0;
    let text: string[] = [];
    const flush = () => {
      if (text.length) blocks.push({ kind: 'p', inlines: parseInline(text.join(' ')) });
      text = [];
    };
    while (i < lines.length) {
      const bullet = /^\s*(?:[-*•])\s+(.*)$/.exec(lines[i]);
      const num = /^\s*\d+[.)]\s+(.*)$/.exec(lines[i]);
      if (bullet || num) {
        flush();
        const kind = bullet ? 'ul' : 'ol';
        const items: Inline[][] = [];
        while (i < lines.length) {
          const b = kind === 'ul' ? /^\s*(?:[-*•])\s+(.*)$/.exec(lines[i]) : /^\s*\d+[.)]\s+(.*)$/.exec(lines[i]);
          if (!b) break;
          items.push(parseInline(b[1]));
          i++;
        }
        blocks.push({ kind, items });
      } else {
        text.push(lines[i].replace(/^#+\s*/, '').trim());
        i++;
      }
    }
    flush();
  }
  return blocks;
}
