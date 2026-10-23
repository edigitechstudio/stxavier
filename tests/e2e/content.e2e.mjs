/**
 * End-to-end smoke test of Phase 4 pages (stories, universities, blog, events, FAQ, search).
 *   npm run dev   # in another terminal
 *   npm run test:e2e:content
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ORIGIN = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const OUT = (process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'stxavier-e2e')) + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const BROWSER =
  process.env.BROWSER_PATH ||
  ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));

const failures = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const go = (p) => page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
const visible = (sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 30000 }).then(() => true, () => false);
/** Wait until React has hydrated an element (its props are attached), so events are handled. */
const hydrated = (selector) =>
  page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'));
  }, selector, { timeout: 30000 }).then(() => page.waitForTimeout(250)); // let the URL-state restore tick run

// Success wall
await go('/en/success-stories');
await hydrated('.wall-card');
const cards = await page.locator('.wall-card').count();
check('success wall renders', cards >= 5, `${cards} stories`);
check('reels are lazy (preload=none)', (await page.locator('.reel video').first().getAttribute('preload')) === 'none');
await page.getByRole('button', { name: /Japan/ }).first().click();
await page.waitForTimeout(200);
check('country filter', (await page.locator('.wall-card').count()) === 1 && page.url().includes('country=japan'));
await page.locator('.wall-card').first().click();
check('story modal opens', await page.locator('[role=dialog] blockquote').isVisible());
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /All countries/ }).click();
await page.screenshot({ path: OUT + 'p4-stories.png', clip: { x: 0, y: 500, width: 1440, height: 1000 } });

// University directory
await go('/en/universities');
const total = await page.locator('.uni-card').count();
await hydrated('#uni-search');
await page.fill('#uni-search', 'data');
await page.waitForTimeout(450); // debounce
const searched = await page.locator('.uni-card').count();
check('debounced search narrows results', searched > 0 && searched < total, `${total} → ${searched}`);
await page.fill('#uni-search', '');
await page.selectOption('.dir-filters select >> nth=0', 'japan');
await page.waitForTimeout(450);
check('country filter + URL', (await page.locator('.uni-card').count()) === 2 && page.url().includes('country=japan'));
await go('/en/universities?fee=lt20');
await page.waitForTimeout(300);
check('fee filter restores from URL', (await page.locator('.dir-filters select >> nth=4').inputValue()) === 'lt20', `${await page.locator('.uni-card').count()} cards`);
await hydrated('.uni-card a.link-arrow');
await page.locator('.uni-card a.link-arrow').first().click();
await page.waitForURL(/\/universities\/[a-z-]+/, { timeout: 30000 }).catch(() => {});
check('university detail page', /\/universities\/[a-z-]+/.test(page.url()) && (await visible('.facts-card')), page.url());
await go('/en/universities');
await page.screenshot({ path: OUT + 'p4-universities.png', clip: { x: 0, y: 500, width: 1440, height: 1000 } });

// Blog
await go('/en/blog');
await hydrated('.blog-filters button');
check('blog list', (await page.locator('.post-card').count()) === 4);
await page.getByRole('button', { name: 'Visa updates' }).click();
check('topic filter', (await page.locator('.post-card').count()) === 1 && page.url().includes('topic=visa'));
await go('/en/blog/ielts-vs-pte-which-test');
check('TOC links match headings', (await page.locator('.toc a').count()) >= 3 && (await page.locator('#which-test-is-easier-for-nepali-students').count()) === 1);
check('related posts', (await page.locator('.post-card').count()) >= 1);
await page.screenshot({ path: OUT + 'p4-post.png', clip: { x: 0, y: 0, width: 1440, height: 1600 } });

// Events
await go('/en/events');
check('upcoming events', (await page.locator('.event-card:not(.is-past)').count()) >= 3);
check('past webinar listed', (await page.locator('.event-card.is-past').count()) >= 1);
await page.screenshot({ path: OUT + 'p4-events.png', clip: { x: 0, y: 500, width: 1440, height: 900 } });
await go('/en/events/uk-university-fair-nov-2026');
await hydrated('.form-card form');
await page.fill('.form-card input[name=name]', 'Test Student');
await page.fill('.form-card input[name=phone]', '9845762340');
await page.getByRole('button', { name: 'Register free' }).click();
check('RSVP submits', await visible('.form-success'));
await go('/en/events/canada-webinar-sep-2026');
check('past webinar shows recording', (await page.locator('video').count()) === 1);

// FAQ hub
await go('/en/faq');
await hydrated('#faq-search');
const allQ = await page.locator('.faq-item').count();
await page.fill('#faq-search', 'visa');
await page.waitForTimeout(200);
const visaQ = await page.locator('.faq-item').count();
check('FAQ search filters', visaQ > 0 && visaQ < allQ, `${allQ} → ${visaQ}`);

// Site search
await go('/en/search?q=ielts');
await page.waitForTimeout(300);
const hits = await page.locator('.search-hit').count();
check('site search', hits > 0 && (await page.locator('.search-hit small', { hasText: 'Article' }).count()) > 0, `${hits} hits`);
await page.screenshot({ path: OUT + 'p4-search.png', clip: { x: 0, y: 300, width: 1440, height: 900 } });

// Homepage: events strip
await go('/en');
check('homepage events strip', (await page.locator('.event-card').count()) === 3);

// Mobile overflow across new pages
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' })).newPage();
for (const p of ['/en/success-stories', '/en/universities', '/ne/blog/how-to-write-a-strong-sop', '/en/events', '/en/faq']) {
  await m.goto(ORIGIN + p, { waitUntil: 'networkidle' });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`no horizontal overflow ${p}`, overflow <= 0, `${overflow}px`);
}

const real = errors.filter((e) => !e.includes('bis_skin_checked'));
check('no page errors', real.length === 0, real.slice(0, 3).join(' | '));
console.log(`\n${failures.length ? `${failures.length} FAILED` : 'ALL PASSED'} · screenshots in ${OUT}`);
await browser.close();
process.exit(failures.length ? 1 : 0);
