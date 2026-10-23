/**
 * End-to-end test of Phase 5 lead capture: booking wizard, double-booking guard, enquiry flow,
 * exit-intent offer and printable guide.
 *   npm run dev   # in another terminal (no database needed — dev uses an in-memory booking store)
 *   npm run test:e2e:booking
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const go = (p) => page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
const visible = (sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 30000 }).then(() => true, () => false);
const hydrated = (selector) =>
  page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'));
  }, selector, { timeout: 30000 }).then(() => page.waitForTimeout(250));
// Each run uses a different client IP so the per-IP rate limits never interfere.
const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.1`;
await ctx.setExtraHTTPHeaders({ 'x-forwarded-for': ip });

// ---- Booking wizard: preset counsellor via ?counsellor= ------------------------------
await go('/en/book?counsellor=sample-counsellor-australia');
await hydrated('.booking-option');
check('preset counsellor skips to mode step', (await page.locator('.booking-steps .is-current').innerText()).includes('meet'));
check('summary shows preset counsellor', (await page.locator('.booking-summary').innerText()).includes('Sample Counsellor'));
await page.locator('.booking-option', { hasText: 'Zoom' }).click();
check('slots load', await visible('.booking-slot'));
const dayCount = await page.locator('.booking-day').count();
check('date chips', dayCount > 3, `${dayCount} days`);
await page.screenshot({ path: OUT + 'p5-book-time.png', fullPage: false });
await page.locator('.booking-day').nth(1).click();
const slotLabel = await page.locator('.booking-slot').nth(2).innerText();
await page.locator('.booking-slot').nth(2).click();
check('details step', await visible('form.lead-form input[name=name]'));
await page.getByRole('button', { name: 'Confirm booking' }).click();
check('client validation blocks empty form', (await page.locator('.field-error').count()) >= 2);
await page.fill('input[name=name]', 'E2E Student');
await page.fill('input[name=phone]', '98' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0'));
await page.fill('input[name=email]', 'e2e@example.com');
await page.screenshot({ path: OUT + 'p5-book-details.png' });
await page.getByRole('button', { name: 'Confirm booking' }).click();
check('booking confirmed', await visible('.booking-done'));
const reference = (await page.locator('.booking-ref').innerText()).trim();
check('reference format', /^SX-[A-Z2-9]{6}$/.test(reference), reference);
check('calendar link', (await page.locator('a[href^="https://calendar.google.com"]').count()) === 1);
check('ics download', (await page.locator('a[download$=".ics"]').getAttribute('href'))?.startsWith('data:text/calendar'));
check('chosen time shown', (await page.locator('.booking-done-card').innerText()).includes(slotLabel), slotLabel);
await page.screenshot({ path: OUT + 'p5-book-done.png' });

// ---- Same slot again through the API → 409 ------------------------------------------
const slots = await (await page.request.get(`${ORIGIN}/api/bookings/slots?counsellor=sample-counsellor-australia&mode=zoom`)).json();
check('slots API responds', Array.isArray(slots.days) && slots.days.every((d) => d.slots.length > 0));
const free = slots.days[0].slots[0];
const bookBody = { counsellor: 'sample-counsellor-australia', mode: 'zoom', start: free.start, name: 'Race One', phone: '9841000001', locale: 'en' };
const [a, b] = await Promise.all([
  page.request.post(`${ORIGIN}/api/bookings`, { data: bookBody }),
  page.request.post(`${ORIGIN}/api/bookings`, { data: { ...bookBody, name: 'Race Two', phone: '9841000002' } }),
]);
check('concurrent double booking: exactly one wins', [a.status(), b.status()].sort().join() === '200,409', `${a.status()} / ${b.status()}`);
const after = await (await page.request.get(`${ORIGIN}/api/bookings/slots?counsellor=sample-counsellor-australia&mode=zoom`)).json();
check('booked slot disappears', !after.days.some((d) => d.slots.some((s) => s.start === free.start)));
const invalid = await page.request.post(`${ORIGIN}/api/bookings`, { data: { ...bookBody, phone: '123' } });
check('invalid phone rejected by API', invalid.status() === 400);

// ---- Enquiry: one question per screen -----------------------------------------------
await go('/en/enquiry');
await hydrated('.enquiry-choice');
await page.screenshot({ path: OUT + 'p5-enquiry.png' });
await page.locator('.enquiry-choice').first().click();
check('choice advances', (await page.locator('.enquiry-count').innerText()).startsWith('2'));
await page.keyboard.press('b'); // letter shortcut picks option B
await page.waitForTimeout(150);
check('letter shortcut advances', (await page.locator('.enquiry-count').innerText()).startsWith('3'));
await page.locator('.enquiry-choice', { hasText: 'Not sure' }).click();
await page.locator('.enquiry-choice').first().click();
await page.locator('.enquiry-input input').fill('Enquiry Tester');
await page.keyboard.press('Enter');
check('Enter advances text question', (await page.locator('.enquiry-count').innerText()).startsWith('6'));
await page.locator('.enquiry-input input').fill('12345');
await page.keyboard.press('Enter');
check('invalid phone blocked', await visible('.enquiry-error'));
await page.locator('.enquiry-input input').fill('9801234567');
await page.keyboard.press('Enter');
await page.getByRole('button', { name: 'Skip' }).click(); // email optional
const progress = Number(await page.locator('.enquiry-progress').getAttribute('aria-valuenow'));
check('progress bar advances', progress > 80, `${progress}%`);
await page.locator('.enquiry textarea').fill('Looking at nursing.');
await page.getByRole('button', { name: 'Send enquiry' }).click();
check('enquiry sent', await visible('.enquiry .form-success'));

// ---- Printable guide ----------------------------------------------------------------
await go('/en/guides/australia');
check('guide renders', await visible('.guide-doc h1'));
check('guide is noindex', (await page.locator('meta[name=robots]').getAttribute('content'))?.includes('noindex'));
check('save-as-PDF button', (await page.getByRole('button', { name: 'Save as PDF' }).count()) === 1);
await page.emulateMedia({ media: 'print' });
check('print hides site chrome', !(await page.locator('.header').isVisible()) && !(await page.locator('.footer').isVisible()));
await page.screenshot({ path: OUT + 'p5-guide-print.png', fullPage: false });
await page.emulateMedia({ media: 'screen' });

// ---- Exit intent (desktop): fresh session, wait past the delay, leave through the top ----
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': ip.replace(/\.1$/, '.2') } });
await ctx2.addInitScript(() => {
  // Run the clock 30× faster so the 10 s delay passes in well under a second.
  const real = Date.now;
  const start = real();
  Date.now = () => start + (real() - start) * 30;
});
const p2 = await ctx2.newPage();
await p2.goto(ORIGIN + '/en/study-in/canada', { waitUntil: 'networkidle' });
await p2.waitForTimeout(1200);
await p2.mouse.move(700, 300);
await p2.mouse.move(700, 0);
await p2.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, relatedTarget: null, bubbles: true })));
const shown = await p2.locator('.exit-form').waitFor({ state: 'visible', timeout: 8000 }).then(() => true, () => false);
check('exit intent shows on top exit', shown);
if (shown) {
  check('country preset from page', (await p2.locator('.exit-form select').inputValue()) === 'canada');
  await p2.screenshot({ path: OUT + 'p5-exit.png' });
  await p2.fill('.exit-form input[name=name]', 'Exit Tester');
  await p2.fill('.exit-form input[name=phone]', '9812345678');
  await p2.fill('.exit-form input[name=email]', 'exit@example.com');
  await p2.locator('.exit-form button[type=submit]').click();
  check('guide link returned', await p2.locator('a', { hasText: 'Open the guide' }).waitFor({ timeout: 15000 }).then(() => true, () => false));
  check('guide link points at printable guide', (await p2.locator('a', { hasText: 'Open the guide' }).getAttribute('href'))?.includes('/guides/canada'));
  await p2.keyboard.press('Escape');
}
await p2.reload({ waitUntil: 'networkidle' });
await p2.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: -1, relatedTarget: null, bubbles: true })));
await p2.waitForTimeout(800);
check('exit intent only once per session', (await p2.locator('.exit-form').count()) === 0);
await p2.goto(ORIGIN + '/en/book', { waitUntil: 'networkidle' });
await ctx2.close();

// ---- Mobile booking layout -----------------------------------------------------------
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const mp = await m.newPage();
await mp.goto(ORIGIN + '/en/book', { waitUntil: 'networkidle' });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check('no horizontal overflow on mobile /book', overflow <= 0, `${overflow}px`);
check('mobile bar Book links to /book', (await mp.locator('.mobile-bar .is-book').getAttribute('href'))?.endsWith('/book'));
await mp.screenshot({ path: OUT + 'p5-book-mobile.png', fullPage: true });
await m.close();

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\nScreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
