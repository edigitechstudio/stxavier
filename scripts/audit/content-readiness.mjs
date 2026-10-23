/**
 * Pre-launch content checklist: every `TODO:` note and every placeholder row (is_placeholder: true)
 * still in the seed content, grouped by file, plus the production environment variables that are
 * missing. Placeholders are hidden in production automatically, but TODO notes inside real text
 * are visible on the site until someone replaces them.
 *   npm run audit:content                      # reads .env.local for the env check
 *   node --env-file=.env.production scripts/audit/content-readiness.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [
  ...fs.readdirSync(path.join(ROOT, 'data/seed')).filter((f) => f.endsWith('.ts')).map((f) => `data/seed/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'content/blog')).filter((f) => /\.mdx?$/.test(f)).map((f) => `content/blog/${f}`),
  'messages/en.json',
  'messages/ne.json',
];

let todos = 0;
let placeholders = 0;
console.log('Content still to replace before launch\n=====================================');
for (const f of files) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    const m = line.match(/TODO:?\s*([^'"`\n]{0,110})/);
    if (m && !line.trim().startsWith('*')) hits.push(`  L${i + 1}: ${m[0].trim()}`);
  });
  const ph = lines.filter((l) => /is_placeholder:\s*true/.test(l)).length;
  const review = lines.filter((l) => /^needs_review:\s*true/.test(l.trim())).length;
  if (!hits.length && !ph && !review) continue;
  todos += hits.length;
  placeholders += ph;
  console.log(`\n${f}${ph ? ` — ${ph} placeholder row(s) (hidden in production)` : ''}${review ? ' — marked needs_review (fact-check before publishing)' : ''}`);
  for (const h of hits.slice(0, 25)) console.log(h);
  if (hits.length > 25) console.log(`  … and ${hits.length - 25} more`);
}

const REQUIRED = {
  NEXT_PUBLIC_SITE_URL: 'Canonical URLs, sitemap, emails (https://stxavier.com.np)',
  NEXT_PUBLIC_SUPABASE_URL: 'Database: editable content, leads, bookings, portal',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Database (public key)',
  SUPABASE_SERVICE_ROLE_KEY: 'Database writes from forms, uploads',
  REVALIDATE_SECRET: 'Instant publishing of content edits',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'Spam protection on forms and chat',
  TURNSTILE_SECRET_KEY: 'Spam protection (server check)',
  RESEND_API_KEY: 'Booking confirmations, lead alerts, guide emails',
  EMAIL_FROM: 'Sender address (verified in Resend)',
  LEADS_NOTIFY_EMAIL: 'Who receives lead & booking alerts',
};
const OPTIONAL = {
  UPSTASH_REDIS_REST_URL: 'Shared rate limiting across serverless instances',
  ANTHROPIC_API_KEY: 'AI chat answers (otherwise basic mode)',
  GOOGLE_PLACES_API_KEY: 'Live Google reviews & rating',
  NEXT_PUBLIC_GA4_ID: 'Analytics (after cookie consent)',
};
try {
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  for (const m of env.matchAll(/^([A-Z0-9_]+)=(.*)$/gm)) if (m[2].trim() && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
} catch {
  /* no .env.local — use the process environment only */
}
const missing = Object.entries(REQUIRED).filter(([k]) => !process.env[k]);
const optional = Object.entries(OPTIONAL).filter(([k]) => !process.env[k]);
console.log('\nEnvironment\n===========');
for (const [k, why] of missing) console.log(`  ✗ ${k} — ${why}`);
for (const [k, why] of optional) console.log(`  · ${k} (optional) — ${why}`);
if (!missing.length) console.log('  ✓ All required variables set');

console.log(`\nSummary: ${todos} TODO note(s), ${placeholders} placeholder row(s), ${missing.length} required env var(s) missing.`);
