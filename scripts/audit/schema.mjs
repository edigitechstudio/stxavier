/**
 * Structured-data (JSON-LD) validation for every sitemap page: valid JSON, schema.org context,
 * Google rich-result required fields per type, absolute URLs, ISO dates, and no empty values.
 *   BASE_URL=http://localhost:3001 npm run audit:schema
 * Final check before launch: paste a few URLs into https://search.google.com/test/rich-results.
 */
const ORIGIN = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
const isAbs = (u) => typeof u === 'string' && /^https?:\/\//.test(u);
const types = (n) => [].concat(n?.['@type'] ?? []);
const has = (n, k) => n?.[k] !== undefined && n[k] !== null && n[k] !== '' && !(Array.isArray(n[k]) && !n[k].length);

/** Required (Google rich results) fields per type. */
const RULES = {
  Organization: (n, e) => ['name', 'url'].forEach((k) => has(n, k) || e(`missing ${k}`)),
  EducationalOrganization: (n, e) => RULES.Organization(n, e),
  LocalBusiness: (n, e) => {
    ['name', 'address', 'telephone'].forEach((k) => has(n, k) || e(`missing ${k}`));
    const a = n.address;
    if (a) ['streetAddress', 'addressLocality', 'addressCountry'].forEach((k) => has(a, k) || e(`address missing ${k}`));
  },
  WebSite: (n, e) => {
    ['name', 'url'].forEach((k) => has(n, k) || e(`missing ${k}`));
    const act = [].concat(n.potentialAction ?? []).find((x) => types(x).includes('SearchAction'));
    if (act) {
      const target = typeof act.target === 'string' ? act.target : act.target?.urlTemplate;
      if (!String(target).includes('{search_term_string}')) e('SearchAction target lacks {search_term_string}');
      if (!String(act['query-input'] ?? '').includes('search_term_string')) e('SearchAction missing query-input');
    }
  },
  BreadcrumbList: (n, e) => {
    const items = [].concat(n.itemListElement ?? []);
    if (!items.length) return e('empty itemListElement');
    items.forEach((it, i) => {
      if (it.position !== i + 1) e(`item ${i + 1} has position ${it.position}`);
      if (!has(it, 'name')) e(`item ${i + 1} missing name`);
      if (i < items.length - 1 && !isAbs(typeof it.item === 'string' ? it.item : it.item?.['@id'])) e(`item ${i + 1} item URL not absolute`);
    });
  },
  FAQPage: (n, e) => {
    const qs = [].concat(n.mainEntity ?? []);
    if (!qs.length) e('no questions');
    qs.forEach((q, i) => {
      if (!has(q, 'name')) e(`question ${i + 1} missing name`);
      if (!has(q.acceptedAnswer, 'text')) e(`question ${i + 1} missing acceptedAnswer.text`);
    });
  },
  HowTo: (n, e) => {
    if (!has(n, 'name')) e('missing name');
    const steps = [].concat(n.step ?? []);
    if (!steps.length) e('no steps');
    steps.forEach((s, i) => has(s, 'text') || has(s, 'itemListElement') || e(`step ${i + 1} missing text`));
  },
  Article: (n, e) => {
    if (!has(n, 'headline')) e('missing headline');
    else if (n.headline.length > 110) e(`headline ${n.headline.length} chars (>110)`);
    if (!ISO.test(n.datePublished ?? '')) e('datePublished not ISO 8601');
    if (n.dateModified && !ISO.test(n.dateModified)) e('dateModified not ISO 8601');
    if (!has(n, 'author') || ![].concat(n.author).every((a) => has(a, 'name'))) e('author missing name');
    if (!has(n, 'image')) e('missing image (recommended)');
  },
  BlogPosting: (n, e) => RULES.Article(n, e),
  Course: (n, e) => {
    ['name', 'description'].forEach((k) => has(n, k) || e(`missing ${k}`));
    if (!has(n.provider, 'name')) e('provider missing name');
  },
  Event: (n, e) => {
    if (!has(n, 'name')) e('missing name');
    if (!ISO.test(n.startDate ?? '')) e('startDate not ISO 8601');
    const loc = [].concat(n.location ?? []);
    if (!loc.length) e('missing location');
    loc.forEach((l) => {
      if (types(l).includes('Place') && !has(l, 'address')) e('Place missing address');
      if (types(l).includes('VirtualLocation') && !isAbs(l.url)) e('VirtualLocation missing absolute url');
    });
  },
  Person: (n, e) => has(n, 'name') || e('missing name'),
  AggregateRating: (n, e) => {
    if (!has(n, 'ratingValue')) e('missing ratingValue');
    if (!has(n, 'reviewCount') && !has(n, 'ratingCount')) e('missing reviewCount/ratingCount');
  },
};

const URL_KEYS = new Set(['url', 'item', 'image', 'logo', 'sameAs', 'contentUrl', 'thumbnailUrl', 'embedUrl']);

function walk(node, path, report, counts) {
  if (Array.isArray(node)) return node.forEach((x, i) => walk(x, `${path}[${i}]`, report, counts));
  if (!node || typeof node !== 'object') return;
  for (const t of types(node)) {
    counts[t] = (counts[t] ?? 0) + 1;
    RULES[t]?.(node, (msg) => report(`${t} ${path}: ${msg}`));
  }
  for (const [k, v] of Object.entries(node)) {
    if (v === '' || v === 'undefined' || v === 'null' || (typeof v === 'number' && Number.isNaN(v))) report(`${path}.${k} is empty/invalid (${JSON.stringify(v)})`);
    if (URL_KEYS.has(k)) for (const u of [].concat(v)) if (typeof u === 'string' && !isAbs(u)) report(`${path}.${k} not absolute: ${u}`);
    if (typeof v === 'object') walk(v, `${path}.${k}`, report, counts);
  }
}

const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const pages = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '').replace(ORIGIN, '') || '/'))];
const problems = [];
const counts = {};
let blocks = 0;
for (let i = 0; i < pages.length; i += 8) {
  await Promise.all(
    pages.slice(i, i + 8).map(async (p) => {
      const html = await (await fetch(ORIGIN + p)).text();
      const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      let faqPages = 0;
      for (const raw of scripts) {
        blocks++;
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          problems.push(`${p}: invalid JSON (${e.message})`);
          continue;
        }
        for (const root of [].concat(data)) {
          if (!String(root['@context'] ?? '').includes('schema.org')) problems.push(`${p}: block without schema.org @context`);
          const nodes = root['@graph'] ?? [root];
          faqPages += [].concat(nodes).filter((n) => types(n).includes('FAQPage')).length;
          walk(nodes, '', (msg) => problems.push(`${p}: ${msg}`), counts);
        }
      }
      if (!scripts.length) problems.push(`${p}: no JSON-LD at all`);
      if (faqPages > 1) problems.push(`${p}: ${faqPages} FAQPage blocks (Google uses one per page)`);
    }),
  );
}

console.log(`Validated ${blocks} JSON-LD blocks on ${pages.length} pages.\nTypes found:`, Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}×${c}`).join(', '));
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems.slice(0, 80)) console.log(`  ✗ ${p}`);
} else console.log('\n✓ All structured data valid.');
process.exit(problems.length ? 1 : 0);
