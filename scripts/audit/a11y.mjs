/**
 * Accessibility audit with axe-core (WCAG 2.1 A + AA): one page per route template from the
 * sitemap, in English and Nepali, light + dark, desktop + mobile, plus interactive states
 * (counselling pop-up, AI chat, mobile menu).
 *   BASE_URL=http://localhost:3001 npm run audit:a11y            # public pages (production build)
 *   BASE_URL=http://localhost:3000 npm run audit:a11y -- --auth  # also portal + admin (dev demo mode)
 *   BASE_URL=http://localhost:3000 npm run audit:a11y -- --auth-only
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ORIGIN = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const AUTH_ONLY = process.argv.includes('--auth-only');
const AUTH = AUTH_ONLY || process.argv.includes('--auth');
const BROWSER =
  process.env.BROWSER_PATH ||
  [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((p) => fs.existsSync(p));

/** One URL per route template: collapse dynamic segments so /study-in/uk and /study-in/japan count once. */
async function templatePages() {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const seen = new Map();
  for (const p of urls) {
    const key = p
      .replace(/^\/(en|ne)/, '')
      .replace(/\/[^/]+$/, (m, off, s) => (s.split('/').length > 2 ? '/:slug' : m));
    if (!seen.has(key)) seen.set(key, p);
  }
  const pages = [...seen.values()];
  // Nepali versions of the main templates too.
  return [
    ...new Set([
      ...pages,
      ...pages.filter((p) => p.split('/').length <= 3).map((p) => p.replace(/^\/en/, '/ne')),
    ]),
  ];
}

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const results = [];
async function audit(ctxOpts, label, path, setup) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...ctxOpts });
  const page = await ctx.newPage();
  try {
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle', timeout: 60000 });
    // Hide the cookie banner so it doesn't mask page content in every run (it is audited on its own).
    if (!label.includes('cookie')) await page.evaluate(() => document.querySelector('.cookie')?.remove());
    if (setup) await setup(page);
    await page.addScriptTag({ content: AXE });
    const r = await page.evaluate(async () => {
      const out = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        resultTypes: ['violations'],
      });
      return out.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' ') + ' — ' + (n.failureSummary || '').split('\n')[1]?.trim()),
        count: v.nodes.length,
      }));
    });
    results.push({ label, path, violations: r });
  } catch (e) {
    results.push({ label, path, error: e.message.split('\n')[0] });
  } finally {
    await ctx.close();
  }
}

const desktop = { viewport: { width: 1366, height: 900 } };
const mobile = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const hydrated = (sel) => (page) =>
  page.waitForFunction(
    (s) => Object.keys(document.querySelector(s) ?? {}).some((k) => k.startsWith('__reactProps')),
    sel,
    { timeout: 30000 },
  );

const pages = AUTH_ONLY ? [] : await templatePages();
console.log(`Auditing ${pages.length} templates…`);
for (const p of pages) await audit(desktop, 'desktop', p);
for (const p of AUTH_ONLY
  ? []
  : ['/en', '/en/study-in/australia', '/en/book', '/en/tools/cost-calculator', '/en/contact']) {
  await audit({ ...desktop, colorScheme: 'dark' }, 'dark', p, (page) =>
    page.evaluate(() => document.documentElement.classList.add('dark')),
  );
  await audit(mobile, 'mobile', p);
}
if (!AUTH_ONLY) {
  await audit(desktop, 'state: cookie banner', '/en');
  await audit(desktop, 'state: counselling pop-up', '/en', async (page) => {
    await hydrated('.hero .btn-primary')(page);
    await page.locator('.hero .btn-primary').first().click();
    await page.locator('[role=dialog]').waitFor();
  });
  await audit(desktop, 'state: AI chat open', '/en/study-in/canada', async (page) => {
    await hydrated('.fab-ai')(page);
    await page.locator('.fab-ai').click();
    await page.locator('#sx-chat').waitFor({ state: 'visible' });
  });
  await audit(mobile, 'state: mobile menu', '/en', async (page) => {
    await hydrated('.menu-btn')(page);
    await page.locator('.menu-btn').first().click();
    await page.waitForTimeout(400);
  });
}
if (AUTH) {
  const as = (id) => ({
    ...desktop,
    storageState: { cookies: [{ name: 'sx_demo_user', value: id, url: ORIGIN }], origins: [] },
  });
  for (const p of [
    '/en/portal',
    '/en/portal/documents',
    '/en/portal/notifications',
    '/en/portal/pre-departure',
  ])
    await audit(as('demo-student'), 'portal', p);
  for (const p of [
    '/admin',
    '/admin/leads',
    '/admin/leads/demo-lead-2',
    '/admin/bookings',
    '/admin/availability',
    '/admin/applications',
    '/admin/applications/demo-app-uk',
    '/admin/users',
    '/admin/cms',
    '/admin/cms/destinations',
    '/admin/cms/destinations/uk',
    '/admin/cms/pages/home',
    '/admin/cms/site/main',
    '/admin/cms/ui',
    '/admin/cms/media',
    '/admin/cms/blog/new',
  ])
    await audit(as('demo-admin'), 'admin', p);
  await audit(desktop, 'login', '/en/portal/login');
  await audit(desktop, 'login', '/admin/login');
}
await browser.close();

let total = 0;
for (const r of results) {
  if (r.error) {
    console.log(`! ${r.label} ${r.path}: ${r.error}`);
    continue;
  }
  if (!r.violations.length) continue;
  console.log(`\n✗ [${r.label}] ${r.path}`);
  for (const v of r.violations) {
    total += v.count;
    console.log(`  - ${v.id} (${v.impact}, ${v.count}×): ${v.help}`);
    for (const n of v.nodes) console.log(`      ${n}`);
  }
}
const clean = results.filter((r) => !r.error && !r.violations.length).length;
console.log(`\n${clean}/${results.length} audits clean · ${total} violating nodes`);
process.exit(total || results.some((r) => r.error) ? 1 : 0);
