/**
 * End-to-end smoke test of the free tools, driving an installed Chromium browser (no download).
 *
 *   npm run dev            # in another terminal
 *   npm run test:e2e       # BASE_URL / BROWSER_PATH / SCREENSHOT_DIR env vars override defaults
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ORIGIN = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE = `${ORIGIN}/en/tools/`;
const OUT = (process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'stxavier-e2e')) + path.sep;
fs.mkdirSync(OUT, { recursive: true });
const BROWSER =
  process.env.BROWSER_PATH ||
  ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const log = (...a) => console.log(...a);

  // 1. Timeline planner renders a plan and exposes calendar links.
  await page.goto(BASE + 'visa-timeline-planner', { waitUntil: 'networkidle' });
  await page.waitForSelector('.plan li');
  log('timeline steps:', await page.locator('.plan li').count(), '| google links:', await page.locator('.plan a[href*="calendar.google.com"]').count());
  await page.selectOption('select >> nth=0', 'japan');
  await page.waitForTimeout(300);
  log('japan first step:', (await page.locator('.plan li strong').first().textContent()).trim());
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download calendar/ }).click()]);
  log('ics download:', download.suggestedFilename());
  await page.screenshot({ path: OUT + 'e2e-timeline.png', fullPage: false, clip: { x: 0, y: 560, width: 1440, height: 900 } });

  // 2. Eligibility quiz: walk all steps, hit the lead gate, submit, see results.
  await page.goto(BASE + 'eligibility-checker', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Master’s degree' }).click();
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: /^Next|See my matches/ }).click();
  await page.waitForSelector('.lock-card');
  log('gate shown, locked cards:', await page.locator('.match-card.is-locked').count());
  await page.fill('.lock-card input[name=name]', 'Test Student');
  await page.fill('.lock-card input[name=phone]', '9845762340');
  await page.getByRole('button', { name: 'Show my results' }).click();
  await page.waitForSelector('.lock-card', { state: 'detached' });
  const top = await page.locator('.match-card h3').first().textContent();
  log('results unlocked, top match:', top.replace(/\s+/g, ' ').trim(), '| cards:', await page.locator('.match-card').count());
  await page.screenshot({ path: OUT + 'e2e-eligibility.png', clip: { x: 0, y: 560, width: 1440, height: 1000 } });

  // 3. Cost calculator: change inputs and confirm the shareable URL updates.
  await page.goto(BASE + 'cost-calculator', { waitUntil: 'networkidle' });
  await page.selectOption('select >> nth=0', 'australia');
  await page.getByRole('radio', { name: 'Major city' }).click();
  await page.waitForTimeout(300);
  log('cost url:', new URL(page.url()).search, '| total:', (await page.locator('.result-hero strong').textContent()).trim());

  // 4. Shared link restores state.
  await page.goto(BASE + 'cost-calculator?country=japan&level=language&city=small&years=2', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  log('restored:', (await page.locator('.result-hero small').textContent()).trim(), '|', (await page.locator('select').first().inputValue()));

  // 5. Checklist ticks persist across reloads.
  await page.goto(BASE + 'document-checklist', { waitUntil: 'networkidle' });
  await page.locator('.check-item input').first().check();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  log('checklist tick persisted:', await page.locator('.check-item input').first().isChecked(), '|', (await page.locator('.progress-label span').first().textContent()).trim());

  // 6. Scholarship filter.
  await page.goto(BASE + 'scholarship-finder?country=japan', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  log('scholarships (japan):', await page.locator('.sch-card').count(), '|', (await page.locator('.result-count').textContent()).trim());

  // 7. Comparison + GPA + EMI quick renders.
  await page.goto(BASE + 'country-comparison', { waitUntil: 'networkidle' });
  log('compare columns:', await page.locator('.compare-table thead th').count() - 1);
  await page.goto(BASE + 'country-comparison?c=japan,cyprus', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  log('compare restored:', (await page.locator('.compare-table thead th').allTextContents()).join(' | '));
  await page.screenshot({ path: OUT + 'e2e-compare.png', clip: { x: 0, y: 560, width: 1440, height: 900 } });
  await page.goto(BASE + 'gpa-percentage-converter', { waitUntil: 'networkidle' });
  log('gpa 3.4 →', (await page.locator('.result-hero strong').textContent()).trim());
  await page.goto(BASE + 'education-loan-emi-calculator', { waitUntil: 'networkidle' });
  await page.locator('.chart g[tabindex]').nth(2).hover();
  log('emi tooltip:', (await page.locator('.chart-tip').textContent()).replace(/\s+/g, ' ').trim());

  // 8. Nepali locale + mobile.
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
  const mp = await m.newPage();
  await mp.goto(`${ORIGIN}/ne/tools/cost-calculator`, { waitUntil: 'networkidle' });
  await mp.screenshot({ path: OUT + 'e2e-mobile-ne.png', fullPage: false });
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log('mobile horizontal overflow px:', overflow);

  const realErrors = errors.filter((e) => !e.includes('bis_skin_checked'));
  log('page errors:', realErrors.slice(0, 5));
  log('screenshots in', OUT);
  await browser.close();
  if (realErrors.length) process.exit(1);
})().catch((e) => {
  console.error('E2E FAILED:', e.message);
  process.exit(1);
});
