/**
 * End-to-end test of the content editor (/admin/cms) in local demo mode: every kind of edit must
 * show up on the public site — site settings, page copy (EN + NE), collections, interface text,
 * blog posts, images — and validation must protect the site.
 *   npm run dev   # without Supabase keys
 *   npm run test:e2e:cms
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
const reset = await fetch(`${ORIGIN}/api/dev/reset-demo`, { method: 'POST' });
if (!reset.ok) throw new Error('reset-demo failed — run the dev server without Supabase keys');

const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await ctx.addCookies([{ name: 'sx_demo_user', value: 'demo-admin', url: ORIGIN }]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => !/Failed to execute 'measure' on 'Performance'.*\[Prerender\]/.test(e.message) && errors.push(e.message));
const go = (p) => page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
const hydrated = (sel) => page.waitForFunction((s) => Object.keys(document.querySelector(s) ?? {}).some((k) => k.startsWith('__reactProps')), sel, { timeout: 30000 }).then(() => page.waitForTimeout(200));
/** The input for a field by its label (first match), optionally the EN/NE side of a pair. */
const field = (label, lang, scope = page) => {
  const f = scope.locator('.cms-field', { has: page.locator(':scope > .cms-label', { hasText: new RegExp(`^${label}(\\s|$)`) }) }).first();
  return lang ? f.locator(`[lang=${lang}]`) : f.locator('input, textarea').first();
};
const save = async () => {
  await page.locator('.cms-savebar button[type=submit]').click();
  return page.locator('.cms-saved, .cms-errors, .notice-ok').first().waitFor({ timeout: 20000 }).then(async () => (await page.locator('.cms-errors').count()) === 0, () => false);
};
const visible = async (p, text) => {
  const pg = await ctx.newPage();
  await pg.goto(ORIGIN + p, { waitUntil: 'networkidle' });
  const body = await pg.locator('body').innerText();
  await pg.close();
  return body.includes(text);
};

// ---- Overview ------------------------------------------------------------------------
await go('/admin/cms');
check('content overview lists collections', (await page.locator('.cms-card').count()) >= 20);
await page.screenshot({ path: OUT + 'cms-overview.png', fullPage: true });

// ---- Site settings → topbar phone ------------------------------------------------------
await go('/admin/cms/site/main');
await hydrated('.cms-savebar button');
await field('Phone').fill('+977-1-9999999');
check('site settings save', await save());
check('phone updated on the site', await visible('/en/contact', '+977-1-9999999'));

// ---- Page copy (EN + NE) → home hero ----------------------------------------------------
await go('/admin/cms/pages/home');
await hydrated('.cms-savebar button');
const hero = page.locator('.cms-group', { has: page.locator(':scope > .cms-disclosure-head > .cms-toggle', { hasText: /^Hero/ }) }).first();
await field('Subtitle', 'en', hero).fill('Edited from the dashboard — English.');
await field('Subtitle', 'ne', hero).fill('ड्यासबोर्डबाट सम्पादन गरिएको।');
check('home page copy saves', await save());
check('English home shows new text', await visible('/en', 'Edited from the dashboard — English.'));
check('Nepali home shows new text', await visible('/ne', 'ड्यासबोर्डबाट सम्पादन गरिएको।'));
await page.screenshot({ path: OUT + 'cms-page-editor.png' });

// ---- Collection entry → destination summary --------------------------------------------
await go('/admin/cms/destinations/uk');
await hydrated('.cms-savebar button');
await field('Summary', 'en').fill('UK summary edited in the CMS.');
check('destination saves', await save());
check('destination card updated', await visible('/en/destinations', 'UK summary edited in the CMS.'));

// ---- Validation: id can't change, required text can't be emptied ------------------------
check('slug is locked on existing entries', await field('Slug').isDisabled());

// ---- New FAQ → FAQ hub, then delete ------------------------------------------------------
await go('/admin/cms/faqs/new');
await hydrated('.cms-savebar button');
await field('Id').fill('e2e-faq');
await field('Scope').fill('general');
await field('Question', 'en').fill('Is this FAQ created by the e2e test?');
await field('Answer', 'en').fill('Yes — added from the dashboard.');
await page.locator('.cms-check', { hasText: 'Published' }).locator('input').check();
check('new FAQ created', await save());
check('URL moved to the new entry', page.url().includes('/admin/cms/faqs/e2e-faq'));
check('FAQ visible on /faq', await visible('/en/faq', 'Is this FAQ created by the e2e test?'));
page.once('dialog', (d) => d.accept());
await page.locator('.cms-delete button').click();
await page.waitForURL(/\/admin\/cms\/faqs\?deleted=1/);
check('FAQ deleted from the site', !(await visible('/en/faq', 'Is this FAQ created by the e2e test?')));

// ---- Duplicate id is refused --------------------------------------------------------------
await go('/admin/cms/destinations/new?from=uk');
await hydrated('.cms-savebar button');
await field('Slug').fill('uk');
check('duplicate slug refused', !(await save()) && (await page.locator('.cms-errors').innerText()).includes('already exists'));

// ---- Interface text: change a label; placeholders protected ------------------------------
await go('/admin/cms/ui?ns=header');
await hydrated('.ui-row input');
await page.locator('input[name="en:header.getStarted"]').fill('Start your journey');
await page.locator('.cms-savebar button[type=submit]').click();
await page.locator('.cms-saved, .cms-errors').first().waitFor({ timeout: 20000 });
check('interface text saved', (await page.locator('.cms-saved').count()) === 1);
check('header button text changed', await visible('/en/contact', 'Start your journey'));
await go('/admin/cms/ui?q=studyIn');
await hydrated('.ui-row input');
const studyIn = page.locator('input[name="en:meta.studyIn"], textarea[name="en:meta.studyIn"]');
await studyIn.fill('Study abroad from Nepal');
await page.locator('.cms-savebar button[type=submit]').click();
await page.locator('.cms-saved, .cms-errors').first().waitFor({ timeout: 20000 });
check('missing {country} placeholder rejected', (await page.locator('.cms-errors').innerText().catch(() => '')).includes('{country}'));
await page.screenshot({ path: OUT + 'cms-ui-text.png' });

// ---- Blog post written in the dashboard --------------------------------------------------
await go('/admin/cms/blog/new');
await hydrated('.cms-savebar button');
await field('Slug').fill('e2e-dashboard-post');
await field('Title', 'en').fill('A post written in the dashboard');
await field('Description', 'en').fill('Created by the e2e test.');
await field('Body', 'en').fill('## Why this matters\n\nPlain **Markdown** works.\n\n<script>alert(1)</script>');
check('blog post created', await save());
const pg = await ctx.newPage();
await pg.goto(ORIGIN + '/en/blog/e2e-dashboard-post', { waitUntil: 'networkidle' });
check('blog post renders', (await pg.locator('h1').innerText()) === 'A post written in the dashboard' && (await pg.locator('article h2, main h2').allInnerTexts()).some((t) => t.includes('Why this matters')));
check('blog markdown is not executable', (await pg.locator('main script:not([type])').count()) === 0);
await pg.goto(ORIGIN + '/en/blog', { waitUntil: 'networkidle' });
check('blog list includes the post', (await pg.locator('body').innerText()).includes('A post written in the dashboard'));
await pg.close();

// ---- Media upload → used as an image ------------------------------------------------------
await go('/admin/cms/media');
await hydrated('.dropzone input');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDbYuxbwAAAABJRU5ErkJggg==', 'base64');
await page.locator('.dropzone input').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png });
check('image uploaded', await page.locator('.media-grid figure img[src^="/uploads/"]').first().waitFor({ timeout: 15000 }).then(() => true, () => false));
const bad = await page.request.post(`${ORIGIN}/api/admin/media`, { multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('<svg onload=alert(1)>') } } });
check('non-image upload refused', bad.status() === 422);

// ---- Permissions ---------------------------------------------------------------------------
const c2 = await browser.newContext();
await c2.addCookies([{ name: 'sx_demo_user', value: 'demo-counsellor', url: ORIGIN }]);
const p2 = await c2.newPage();
await p2.goto(ORIGIN + '/admin/cms', { waitUntil: 'networkidle' });
check('counsellors cannot edit content', p2.url().includes('error=admin_only'));
check('counsellors cannot upload media', (await p2.request.get(`${ORIGIN}/api/admin/media`)).status() === 403);
await c2.close();

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
await fetch(`${ORIGIN}/api/dev/reset-demo`, { method: 'POST' });
console.log(`\nScreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
