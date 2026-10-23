/**
 * Cross-browser smoke test: the same core journeys in Chromium (Edge/Chrome), Firefox and WebKit
 * (Safari's engine), on desktop and phone viewports. Run against a production build:
 *   npm run build && npx next start -p 3001
 *   BASE_URL=http://localhost:3001 npm run test:e2e:browsers
 * Needs the engines once: npx playwright-core install firefox webkit
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright-core';

const ORIGIN = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const OUT = (process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'stxavier-e2e')) + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const EDGE =
  process.env.BROWSER_PATH ||
  ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));

const ENGINES = [
  ['chromium', () => chromium.launch({ executablePath: EDGE, headless: true })],
  ['firefox', () => firefox.launch({ headless: true })],
  ['webkit', () => webkit.launch({ headless: true })],
];
const VIEWPORTS = [
  ['desktop', { viewport: { width: 1366, height: 900 } }],
  ['phone', { viewport: { width: 390, height: 844 }, hasTouch: true }],
];
const PAGES = ['/en', '/ne', '/en/destinations', '/en/study-in/australia', '/en/test-prep/ielts', '/en/tools/cost-calculator', '/en/universities', '/en/blog', '/en/book', '/en/contact', '/en/for-parents'];

const failures = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};
/**
 * Navigate and let the page settle before the next step. Back-to-back navigations fired before
 * the previous page settles can leave Firefox with a dangling navigation that blocks later actions.
 */
async function visit(page, p, timeout = 60000) {
  const res = await page.goto(ORIGIN + p, { waitUntil: 'load', timeout });
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.waitForTimeout(250);
  return res;
}
/**
 * Playwright's Firefox driver can wait forever on Next's same-document history updates
 * ("waiting for navigation to finish") although the page is fully usable. Actions try the normal
 * path first and fall back to DOM events, which reach the same React handlers.
 */
const click = (page, sel, nth = 0) =>
  page
    .locator(sel)
    .nth(nth)
    .click({ timeout: 6000 })
    .catch(() => page.evaluate(([q, n]) => document.querySelectorAll(q)[n]?.click(), [sel, nth]));
const fill = (page, sel, value) =>
  page
    .locator(sel)
    .first()
    .fill(value, { timeout: 6000 })
    .catch(() =>
      page.evaluate(
        ([q, v]) => {
          const el = document.querySelector(q);
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur', { bubbles: true }));
        },
        [sel, value],
      ),
    );
/** Wait for a selector from inside the page (not subject to the driver's navigation tracking). */
const appear = (page, sel, timeout = 15000) =>
  page.waitForFunction((q) => [...document.querySelectorAll(q)].some((e) => e.getClientRects().length > 0), sel, { timeout }).then(() => true, () => false);
/** innerText read inside the page. */
const text = (page, sel) => page.evaluate((q) => document.querySelector(q)?.innerText ?? '', sel);
const hydrated = (page, sel) =>
  page.waitForFunction((s) => Object.keys(document.querySelector(s) ?? {}).some((k) => k.startsWith('__reactProps')), sel, { timeout: 30000 }).then(() => page.waitForTimeout(200));

for (const [engine, launch] of ENGINES) {
  let browser;
  try {
    browser = await launch();
  } catch (e) {
    check(`${engine}: launch`, false, e.message.split('\n')[0]);
    continue;
  }
  for (const [vpName, vp] of VIEWPORTS) {
    const tag = `${engine}/${vpName}`;
    const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const ctx = await browser.newContext({ ...vp, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': ip } });
    let page = await ctx.newPage();
    const errors = [];
    // WebKit reports prefetches cancelled by the test's rapid navigation as "access control" errors;
    // they don't occur when a page is used normally, so they're ignored here.
    const watch = (pg) => pg.on('pageerror', (e) => !(/_rsc=/.test(e.message) && /access control checks/.test(e.message)) && errors.push(e.message));
    watch(page);
    /** Each journey starts in a fresh tab (same browser context), so one journey's state can't leak into the next. */
    const fresh = async () => {
      await page.close();
      page = await ctx.newPage();
      watch(page);
    };

    // Every main template renders without horizontal overflow or runtime errors.
    const overflow = [];
    for (const p of PAGES) {
      const res = await visit(page, p);
      if (!res?.ok()) overflow.push(`${p} HTTP ${res?.status()}`);
      const x = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (x > 1) overflow.push(`${p} +${x}px`);
    }
    check(`${tag}: ${PAGES.length} pages render, no horizontal overflow`, overflow.length === 0, overflow.join(', '));

    await visit(page, '/en');
    await page.evaluate(() => document.querySelector('.cookie')?.remove());
    check(`${tag}: hero visible`, await appear(page, '.hero h1', 10000));
    await page.screenshot({ path: `${OUT}p8-${engine}-${vpName}-home.png` });

    // Navigation: desktop dropdown / phone drawer.
    if (vpName === 'desktop') {
      await hydrated(page, '.nav-item button, .nav-item a');
      // Menus open on hover and on keyboard focus (:focus-within); focus is the fallback when the driver stalls.
      await page.locator('.nav-item').first().hover({ timeout: 6000 }).catch(() => page.evaluate(() => document.querySelector('.nav-item .nav-link')?.focus()));
      check(`${tag}: nav dropdown opens`, await page.locator('.nav-item').first().locator('.dropdown').waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false));
    } else {
      await hydrated(page, '.menu-btn');
      await click(page, '.menu-btn');
      check(`${tag}: mobile drawer opens`, await appear(page, '.drawer.is-open', 5000));
      await page.keyboard.press('Escape');
      await visit(page, '/en');
      await page.evaluate(() => document.querySelector('.cookie')?.remove());
    }

    await fresh();
    // Counselling pop-up: opens, validates a bad Nepali phone number, closes with Escape.
    await visit(page, '/en');
    await hydrated(page, '.hero .btn-primary');
    await click(page, '.hero .btn-primary');
    await page.evaluate(() => document.querySelector('.cookie')?.remove());
    await appear(page, '.modal', 8000);
    await fill(page, '.modal input[name=name]', 'Browser Test');
    await fill(page, '.modal input[name=phone]', '12345');
    await click(page, '.modal button[type=submit]');
    check(`${tag}: lead form validates phone`, await appear(page, '.modal .field-error', 5000));
    await page.keyboard.press('Escape');
    check(`${tag}: modal closes on Escape`, await page.waitForFunction(() => !document.querySelector('.modal'), null, { timeout: 5000 }).then(() => true, () => false));

    await fresh();
    // Language switch keeps the page.
    await visit(page, '/ne/contact');
    check(`${tag}: Nepali page`, (await page.getAttribute('html', 'lang')) === 'ne');

    await fresh();
    // A calculator updates its result.
    await visit(page, '/en/tools/gpa-percentage-converter');
    await hydrated(page, 'input');
    const before = await text(page, '.result-hero');
    await fill(page, 'input[type=number], input[inputmode=decimal]', '3.2');
    await page.waitForTimeout(300);
    const after = await text(page, '.result-hero');
    check(`${tag}: calculator responds`, after.length > 0 && after !== before, after.split('\n').slice(0, 2).join(' '));
    // The tool writes its inputs into the URL (shareable links); let that settle before navigating away.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await fresh();
    // Booking wizard steps forward.
    await visit(page, '/en/book');
    await appear(page, '.booking-option, .booking-done');
    if ((await page.locator('.booking-done').count()) > 0) {
      check(`${tag}: booking shows 'unavailable' (no verified counsellors)`, (await text(page, '.booking-done')).includes('call or WhatsApp'));
    } else {
      await hydrated(page, '.booking-option');
      await click(page, '.booking-option', 1);
      check(`${tag}: booking wizard advances`, (await text(page, '.booking-steps .is-current')).includes('meet'));
    }

    await fresh();
    // AI chat opens and answers (basic mode without an API key).
    await visit(page, '/en/study-in/canada');
    await page.evaluate(() => document.querySelector('.cookie')?.remove());
    await hydrated(page, '.fab-ai');
    await click(page, '.fab-ai');
    await appear(page, '#sx-chat');
    await click(page, '.chat-suggest button', 3);
    const answered = await appear(page, '.chat-handoff', 30000);
    check(`${tag}: AI chat answers`, answered);
    await page.screenshot({ path: `${OUT}p8-${engine}-${vpName}-chat.png` });

    check(`${tag}: no runtime errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close();
}

console.log(`\nScreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
