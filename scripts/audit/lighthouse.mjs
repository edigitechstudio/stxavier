/**
 * Lighthouse audit of key pages (mobile by default, `--desktop` for desktop).
 * Run against a PRODUCTION build — dev-mode numbers are meaningless:
 *   npm run build && npx next start -p 3001
 *   BASE_URL=http://localhost:3001 npm run audit:lighthouse
 * Writes JSON reports to $AUDIT_DIR (default: os tmp) and prints a summary table.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const ORIGIN = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const OUT = process.env.AUDIT_DIR || path.join(os.tmpdir(), 'stxavier-audit');
fs.mkdirSync(OUT, { recursive: true });
const desktop = process.argv.includes('--desktop');
const only = process.argv.find((a) => a.startsWith('--pages='))?.slice(8).split(',');
const PAGES = only ?? [
  '/en',
  '/ne',
  '/en/destinations',
  '/en/study-in/australia',
  '/en/test-prep/ielts',
  '/en/tools/cost-calculator',
  '/en/universities',
  '/en/blog',
  '/en/success-stories',
  '/en/book',
  '/en/contact',
];
const CHROME =
  process.env.BROWSER_PATH ||
  ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));

const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'] });
const rows = [];
const problems = new Map();
try {
  for (const page of PAGES) {
    const url = ORIGIN + page;
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(desktop ? { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttlingMethod: 'simulate', throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } : {}),
    });
    const lhr = result.lhr;
    fs.writeFileSync(path.join(OUT, `lh-${desktop ? 'desktop' : 'mobile'}-${page.replace(/\W+/g, '_') || 'root'}.json`), result.report);
    const s = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const a = (k) => lhr.audits[k];
    rows.push({
      page,
      perf: s('performance'),
      a11y: s('accessibility'),
      bp: s('best-practices'),
      seo: s('seo'),
      LCP: a('largest-contentful-paint')?.displayValue,
      CLS: a('cumulative-layout-shift')?.displayValue,
      TBT: a('total-blocking-time')?.displayValue,
    });
    for (const [id, audit] of Object.entries(lhr.audits)) {
      if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative' && audit.scoreDisplayMode !== 'manual' && audit.scoreDisplayMode !== 'notApplicable') {
        const p = problems.get(id) ?? { title: audit.title, pages: [] };
        p.pages.push(`${page}${audit.displayValue ? ` (${audit.displayValue})` : ''}`);
        problems.set(id, p);
      }
    }
    console.log(`… ${page} done`);
  }
} finally {
  await chrome.kill();
}

console.log(`\nLighthouse (${desktop ? 'desktop' : 'mobile'}) — ${ORIGIN}`);
console.table(rows);
console.log('\nAudits below 90 (id — title — pages):');
for (const [id, p] of [...problems].sort((a, b) => b[1].pages.length - a[1].pages.length)) console.log(`- ${id} — ${p.title}\n    ${p.pages.join(', ')}`);
console.log(`\nFull JSON reports: ${OUT}`);
