/**
 * End-to-end test of Phase 7: the AI chat assistant widget.
 * Runs against the dev server in basic (retrieval-only) mode when no AI key is configured —
 * the widget, retrieval, handoff and lead capture are the same in both modes.
 *   npm run dev   # in another terminal
 *   npm run test:e2e:chat
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
const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.9`;
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': ip } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const go = (p) => page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
const hydrated = (selector) =>
  page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'));
  }, selector, { timeout: 30000 }).then(() => page.waitForTimeout(250));
/** Wait until the latest assistant answer has finished streaming. */
const answered = async () => {
  await page.locator('.chat-handoff').waitFor({ state: 'visible', timeout: 30000 });
  return page.locator('.chat-msg.is-assistant').last().innerText();
};

await go('/en/study-in/australia');
await hydrated('.fab-ai');
check('chat button labelled as AI', (await page.locator('.fab-ai').getAttribute('aria-label')) === 'Ask our AI assistant' && (await page.locator('.fab-ai-badge').innerText()) === 'AI');
check('panel not rendered until opened', (await page.locator('#sx-chat').count()) === 0);

await page.locator('.fab-ai').click();
check('panel opens', await page.locator('#sx-chat').waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false));
check('clearly states it is an AI', (await page.locator('.chat-head').innerText()).includes('AI') && (await page.locator('.chat-disclaimer').innerText()).includes('AI assistant'));
check('suggestions shown', (await page.locator('.chat-suggest button').count()) === 4);
check('composer focused', await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA'));
await page.screenshot({ path: OUT + 'p7-chat-open.png' });

// Suggested question → grounded answer with sources and handoff.
await page.locator('.chat-suggest button').first().click();
let answer = await answered();
check('answer about Australia costs', /Australia/.test(answer) && /AUD|tuition/i.test(answer), answer.slice(0, 80).replace(/\n/g, ' '));
check('source links to the country page', (await page.locator('.chat-sources a').first().getAttribute('href')) === '/en/study-in/australia');
check('handoff: WhatsApp', (await page.locator('.chat-handoff a.is-wa').getAttribute('href'))?.startsWith('https://wa.me/'));
check('handoff: book', (await page.locator('.chat-handoff a', { hasText: 'Book' }).getAttribute('href')) === '/en/book');
const mode = (await page.locator('.chat-note').count()) > 0 ? 'basic' : 'ai';
console.log(`  (assistant mode: ${mode})`);
await page.screenshot({ path: OUT + 'p7-chat-answer.png' });

// Follow-up with Enter inherits the topic.
await page.locator('.chat-compose textarea').fill('and the visa?');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
answer = await answered();
check('follow-up keeps the topic', /visa/i.test(answer) && /Australia|subclass/i.test(answer), answer.slice(0, 80).replace(/\n/g, ' '));

// Out-of-scope questions are declined and pointed to a counsellor.
await page.locator('.chat-compose textarea').fill('Write me a poem about cats');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
answer = await answered();
check('off-topic handled honestly', mode === 'ai' || /don’t have that information/.test(answer));

// User text is never rendered as HTML.
await page.locator('.chat-compose textarea').fill('<img src=x onerror="window.__xss=1"> hello');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
await answered();
check('no HTML injection from user text', (await page.locator('.chat-log img').count()) === 0 && !(await page.evaluate(() => window.__xss)));

// Call-back request becomes a lead with the questions attached.
await page.locator('.chat-handoff button', { hasText: 'call back' }).click();
await page.locator('.chat-callback input[name=name]').fill('Chat Tester');
await page.locator('.chat-callback input[name=phone]').fill('9807654321');
await page.locator('.chat-callback button[type=submit]').click();
check('call-back request sent', await page.locator('.chat-callback .form-success').waitFor({ timeout: 15000 }).then(() => true, () => false));

// Conversation survives navigation within the session.
const count = await page.locator('.chat-msg').count();
await go('/en/contact');
await hydrated('.fab-ai');
await page.locator('.fab-ai').click();
await page.locator('.chat-msg').nth(count - 1).waitFor({ timeout: 10000 }).catch(() => {});
check('conversation restored after navigation', (await page.locator('.chat-msg').count()) === count, `${count}`);
await page.keyboard.press('Escape');
check('Escape closes and returns focus', !(await page.locator('#sx-chat').isVisible()) && (await page.evaluate(() => document.activeElement?.classList.contains('fab-ai'))));
await page.locator('.fab-ai').click();
await page.locator('.chat-head button[aria-label="New chat"]').click();
check('new chat clears history', (await page.locator('.chat-msg').count()) === 1 && (await page.locator('.chat-suggest').isVisible()));

// The lead reached the admin (demo mode).
const admin = await browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': ip.replace(/\.9$/, '.8') } });
const ap = await admin.newPage();
await ap.goto(ORIGIN + '/admin/login', { waitUntil: 'networkidle' });
if ((await ap.locator('button[name=role][value=admin]').count()) > 0) {
  await ap.locator('button[name=role][value=admin]').click();
  await ap.waitForURL(/\/admin(\?|$)/);
  await ap.goto(ORIGIN + '/admin/leads?source=chat', { waitUntil: 'networkidle' });
  check('chat lead visible to staff', (await ap.locator('.admin-table tbody tr', { hasText: 'Chat Tester' }).count()) >= 1);
}
await admin.close();

// Nepali.
await go('/ne/study-in/canada');
await hydrated('.fab-ai');
await page.locator('.fab-ai').click();
check('Nepali UI', (await page.locator('.chat-compose textarea').getAttribute('placeholder'))?.includes('विदेश'));
await page.locator('.chat-compose textarea').fill('क्यानडामा पढ्दै काम गर्न पाइन्छ?');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
answer = await answered();
check('Nepali question answered', /क्यानडा|Canada|work/i.test(answer), answer.slice(0, 60).replace(/\n/g, ' '));
await page.screenshot({ path: OUT + 'p7-chat-ne.png' });

// Mobile: full-screen panel.
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-forwarded-for': ip.replace(/\.9$/, '.7') } });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push(e.message));
await mp.goto(ORIGIN + '/en', { waitUntil: 'networkidle' });
await mp.waitForFunction(() => Object.keys(document.querySelector('.fab-ai') ?? {}).some((k) => k.startsWith('__reactProps')), null, { timeout: 30000 });
await mp.locator('.fab-ai').click();
const box = await mp.locator('#sx-chat').boundingBox();
check('mobile panel is full screen', !!box && box.width >= 389 && box.height >= 800, box ? `${box.width}×${box.height}` : 'none');
await mp.locator('.chat-suggest button').nth(2).click();
await mp.locator('.chat-handoff').waitFor({ timeout: 30000 });
await mp.screenshot({ path: OUT + 'p7-chat-mobile.png' });
await mp.locator('.chat-head button[aria-label="Close chat"]').click();
check('mobile close', !(await mp.locator('#sx-chat').isVisible()));
await m.close();

// API guards.
const bad = await page.request.post(`${ORIGIN}/api/chat`, { data: { messages: [{ role: 'assistant', content: 'hi' }] } });
check('API rejects malformed conversations', bad.status() === 400);
const long = await page.request.post(`${ORIGIN}/api/chat`, { data: { messages: [{ role: 'user', content: 'x'.repeat(1200) }] } });
check('API rejects over-long questions', long.status() === 400);

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\nScreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
