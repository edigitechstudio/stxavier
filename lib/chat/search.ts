import type { KnowledgeChunk } from '@/types/chat';

/**
 * Tiny BM25 search over the consultancy's own content. No embeddings or external service:
 * deterministic, free and fast for a few hundred chunks. Works for English and Devanagari.
 */

const STOP = new Set(
  'a an and are as at be by can do does for from how i in is it me my of on or so that the this to what when where which who why will with you your we our us about want need tell please much many there their them'.split(' '),
);

/** Query words that should also match their common equivalents in the content. */
const SYNONYMS: Record<string, string[]> = {
  cost: ['fee', 'tuition', 'expense', 'price', 'budget', 'living'],
  fee: ['cost', 'tuition'],
  price: ['cost', 'fee'],
  expensive: ['cost', 'fee'],
  cheap: ['cost', 'fee', 'affordable'],
  job: ['work', 'part-time'],
  work: ['job', 'part-time'],
  paper: ['document'],
  papers: ['document'],
  uk: ['united', 'kingdom', 'britain', 'england'],
  britain: ['uk'],
  england: ['uk'],
  usa: ['america', 'united', 'states'],
  us: ['usa', 'america'],
  america: ['usa'],
  nz: ['zealand'],
  aus: ['australia'],
  oz: ['australia'],
  ielts: ['english', 'test'],
  pte: ['english', 'test'],
  toefl: ['english', 'test'],
  scholarship: ['funding', 'bursary'],
  pr: ['permanent', 'residency'],
  // Common Nepali terms → English content words (content is bilingual, but many rows are English-only).
  खर्च: ['cost', 'fee'],
  शुल्क: ['fee', 'cost'],
  भिसा: ['visa'],
  कागजात: ['document'],
  काम: ['work', 'job'],
  छात्रवृत्ति: ['scholarship'],
  अष्ट्रेलिया: ['australia'],
  अस्ट्रेलिया: ['australia'],
  क्यानडा: ['canada'],
  जापान: ['japan'],
  अमेरिका: ['usa', 'america'],
  बेलायत: ['uk'],
  साइप्रस: ['cyprus'],
  न्युजिल्याण्ड: ['zealand'],
};

/** Nepali postpositions/plurals glued to the noun: "क्यानडामा" (in Canada) → "क्यानडा". */
const NE_SUFFIXES = ['हरूलाई', 'हरूमा', 'हरूको', 'हरू', 'लाई', 'बाट', 'सँग', 'देखि', 'सम्म', 'मा', 'को', 'का', 'की', 'ले'];

function stem(w: string) {
  if (/[ऀ-ॿ]/.test(w)) {
    const s = NE_SUFFIXES.find((x) => w.endsWith(x) && w.length - x.length >= 3);
    return s ? w.slice(0, -s.length) : w;
  }
  if (!/^[a-z]+$/.test(w) || w.length <= 3) return w;
  if (w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.endsWith('ing') && w.length > 6) return w.slice(0, -3);
  if (w.endsWith('es') && /(?:ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [])
    .filter((t) => !STOP.has(t) && (t.length > 1 || /\p{N}/u.test(t)))
    .map(stem);
}

export function expandQuery(tokens: string[]) {
  const out = [...tokens];
  for (const t of tokens) for (const s of SYNONYMS[t] ?? []) out.push(...tokenize(s));
  return out;
}

export type SearchIndex = {
  docs: { chunk: KnowledgeChunk; tf: Map<string, number>; len: number; titleTerms: Set<string> }[];
  df: Map<string, number>;
  avgLen: number;
};

export function buildIndex(chunks: KnowledgeChunk[]): SearchIndex {
  const df = new Map<string, number>();
  const docs = chunks.map((chunk) => {
    // Titles count double: a question that matches a heading is usually the right chunk.
    const title = `${chunk.title.en} ${chunk.title.ne ?? ''}`;
    const tokens = [...tokenize(title), ...tokenize(title), ...tokenize(`${chunk.text.en} ${chunk.text.ne ?? ''} ${chunk.keywords ?? ''}`)];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return { chunk, tf, len: tokens.length, titleTerms: new Set(tokenize(title)) };
  });
  return { docs, df, avgLen: docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length) };
}

const K1 = 1.2;
const B = 0.75;

/** Top-k chunks for a query. `boostPath` (the page the visitor is on) gently favours its own content. */
export type SearchHit = {
  chunk: KnowledgeChunk;
  score: number;
  /** Share of the question's words (or their synonyms) this chunk contains, 0–1. */
  coverage: number;
};

const groupsOf = (text: string) => [...new Set(tokenize(text))].map((w) => new Set(expandQuery([w])));

/**
 * `focus` is the newest message when `query` also carries earlier turns as context: chunks are
 * ranked and judged by how much of the *new* message they cover, so a follow-up like
 * "and the visa?" finds visa content and an off-topic follow-up doesn't inherit the old topic.
 */
export function search(index: SearchIndex, query: string, k = 6, boostPath?: string, focus?: string): SearchHit[] {
  // Each question word plus its synonyms forms a group; coverage counts groups that match.
  const focusGroups = groupsOf(focus ?? query);
  // Words from the new message (and their synonyms) count fully; earlier turns only add a
  // little context — unexpanded, so the old topic's synonyms can't outweigh the new question.
  const focusTerms = new Set(focusGroups.flatMap((g) => [...g]));
  const contextTerms = focus ? tokenize(query).filter((t) => !focusTerms.has(t)) : [];
  const terms = [...new Set([...focusTerms, ...contextTerms])];
  const weight = (t: string) => (focusTerms.has(t) ? 1 : 0.25);
  if (!terms.length) return [];
  const n = index.docs.length;
  return index.docs
    .map((d) => {
      const coverage = focusGroups.length ? focusGroups.filter((g) => [...g].some((t) => d.tf.has(t))).length / focusGroups.length : 0;
      let score = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const df = index.df.get(t) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += (weight(t) * idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / index.avgLen));
      }
      if (score > 0 && boostPath && boostPath !== '/' && d.chunk.path.startsWith(boostPath)) score *= 1.25;
      // A question that matches a chunk's heading is usually answered by that chunk.
      const titleCoverage = focusGroups.length ? focusGroups.filter((g) => [...g].some((t) => d.titleTerms.has(t))).length / focusGroups.length : 0;
      score *= 1 + 0.6 * titleCoverage;
      if (focus) score *= 1 + coverage;
      return { chunk: d.chunk, score, coverage };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
