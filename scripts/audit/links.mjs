/**
 * Broken-link check: crawls every URL in the sitemap (and every internal page linked from them),
 * then verifies all internal links, images, scripts, styles and #anchors. `--external` also checks
 * outbound links (slower; some sites block bots, so review those by hand).
 *   BASE_URL=http://localhost:3001 npm run audit:links [-- --external]
 */
const ORIGIN = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
// Absolute URLs built from NEXT_PUBLIC_SITE_URL (canonical, hreflang, schema) are treated as internal.
const SITE = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EXTERNAL = process.argv.includes('--external');
const SKIP = [/^mailto:/, /^tel:/, /^javascript:/, /^data:/, /^#$/, /^https:\/\/wa\.me\//, /^\/api\/portal\//, /^\/api\/auth\//];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const toInternal = (u) => (u.startsWith(SITE) ? u.slice(SITE.length) || '/' : u.startsWith(ORIGIN) ? u.slice(ORIGIN.length) || '/' : u);

const status = new Map(); // url → Promise<{code, finalUrl, html?}>
const sources = new Map(); // url → Set<page>
const anchors = []; // { page, target, id }

function get(url, wantHtml) {
  if (!status.has(url)) {
    status.set(
      url,
      (async () => {
        const abs = url.startsWith('http') ? url : ORIGIN + url;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await fetch(abs, {
              redirect: 'follow',
              signal: AbortSignal.timeout(20000),
              headers: { 'user-agent': 'Mozilla/5.0 (compatible; StXavierLinkCheck/1.0)', accept: 'text/html,*/*' },
            });
            const type = res.headers.get('content-type') ?? '';
            const html = wantHtml && type.includes('text/html') ? await res.text() : undefined;
            if (!html) await res.body?.cancel();
            return { code: res.status, finalUrl: res.url, html };
          } catch (e) {
            if (attempt) return { code: 0, error: e.message };
          }
        }
      })(),
    );
  }
  return status.get(url);
}

function extract(html) {
  const out = [];
  for (const m of html.matchAll(/<(a|link|img|script|source)\b[^>]*?\s(href|src|srcset)="([^"]+)"/g)) {
    const [, tag, attr, raw] = m;
    if (tag === 'link' && /rel="(preconnect|dns-prefetch)"/.test(m[0])) continue;
    const vals = attr === 'srcset' ? raw.split(',').map((x) => x.trim().split(/\s+/)[0]) : [raw];
    for (const v of vals) out.push({ tag, url: decode(v) });
  }
  return out;
}

const sitemap = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const queue = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toInternal(m[1])))];
const crawled = new Set();
console.log(`Crawling ${queue.length} sitemap URLs (+ linked pages)…`);

while (queue.length) {
  const batch = queue.splice(0, 8).filter((p) => !crawled.has(p));
  batch.forEach((p) => crawled.add(p));
  await Promise.all(
    batch.map(async (pagePath) => {
      const r = await get(pagePath, true);
      if (!r.html) return;
      const ids = new Set([...r.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      for (const { tag, url } of extract(r.html)) {
        if (SKIP.some((re) => re.test(url))) continue;
        if (url.startsWith('#')) {
          anchors.push({ page: pagePath, id: url.slice(1), ok: ids.has(decodeURIComponent(url.slice(1))) });
          continue;
        }
        const internal = toInternal(url);
        const isInternal = internal.startsWith('/') && !internal.startsWith('//');
        if (!isInternal && !EXTERNAL) continue;
        const key = isInternal ? internal.split('#')[0] : url;
        if (!sources.has(key)) sources.set(key, new Set());
        sources.get(key).add(pagePath);
        // Follow internal HTML pages (not assets) so pages missing from the sitemap are checked too.
        if (isInternal && tag === 'a' && !/\.\w{2,5}($|\?)/.test(key) && !crawled.has(key) && !key.startsWith('/api/')) queue.push(key);
      }
    }),
  );
}

const keys = [...sources.keys()];
let done = 0;
const broken = [];
for (let i = 0; i < keys.length; i += 12) {
  await Promise.all(
    keys.slice(i, i + 12).map(async (k) => {
      const r = await get(k, false);
      done++;
      // 401/403/429 from third parties usually means "bot blocked", not broken: report separately.
      if (r.code === 0 || r.code >= 400) broken.push({ url: k, code: r.code || r.error, from: [...sources.get(k)].slice(0, 4) });
    }),
  );
}

const internalBroken = broken.filter((b) => b.url.startsWith('/'));
const externalBroken = broken.filter((b) => !b.url.startsWith('/'));
const missingAnchors = anchors.filter((a) => !a.ok);
console.log(`\nChecked ${crawled.size} pages, ${done} unique links/assets${EXTERNAL ? ' (incl. external)' : ''}, ${anchors.length} in-page anchors.`);
for (const [title, list] of [['Broken internal', internalBroken], ['Broken / blocked external', externalBroken]]) {
  if (!list.length) continue;
  console.log(`\n${title} (${list.length}):`);
  for (const b of list) console.log(`  ✗ ${b.code} ${b.url}\n      from ${b.from.join(', ')}`);
}
if (missingAnchors.length) {
  console.log(`\nMissing #anchor targets (${missingAnchors.length}):`);
  for (const a of missingAnchors.slice(0, 30)) console.log(`  ✗ #${a.id} on ${a.page}`);
}
if (!internalBroken.length && !missingAnchors.length) console.log('\n✓ No broken internal links or anchors.');
process.exit(internalBroken.length || missingAnchors.length ? 1 : 0);
