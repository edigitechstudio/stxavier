/**
 * End-to-end test of Phase 6: student portal + admin dashboard, in local demo mode
 * (no Supabase → one-click demo accounts backed by an in-memory store).
 *   npm run dev   # in another terminal, WITHOUT Supabase env vars
 *   npm run test:e2e:portal
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
const errors = [];
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...opts });
  const page = await ctx.newPage();
  // React's dev-only performance tracks can replay a cached server prerender with timestamps from
  // before the page's time origin ("'​Overview [Prerender]' cannot have a negative time stamp").
  // That instrumentation doesn't exist in production builds, so it's not an app error.
  const devOnly = (m) => /Failed to execute 'measure' on 'Performance'.*\[Prerender\]/.test(m);
  page.on('pageerror', (e) => !devOnly(e.message) && errors.push(e.message));
  return { ctx, page };
};
const go = (page, p) => page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
const visible = (page, sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 30000 }).then(() => true, () => false);
/** Poll a condition after a server action instead of sleeping a fixed time. */
const until = async (page, fn, ms = 10000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn().catch(() => false)) return true;
    await page.waitForTimeout(150);
  }
  return false;
};
const signIn = async (page, area, role) => {
  await go(page, area === 'admin' ? '/admin/login' : '/en/portal/login');
  await page.locator(`button[name=role][value=${role}]`).click();
  await page.waitForURL(area === 'admin' ? /\/admin(\?|$)/ : /\/en\/portal$/, { timeout: 30000 });
};

// Start from the seeded demo data every run.
const reset = await fetch(`${ORIGIN}/api/dev/reset-demo`, { method: 'POST' });
if (!reset.ok) throw new Error('reset-demo failed — is the dev server running without Supabase?');

// ---- Guards ----------------------------------------------------------------------------
{
  const { ctx, page } = await newPage();
  await go(page, '/en/portal/documents');
  check('portal redirects signed-out visitors to login', page.url().includes('/en/portal/login?next=%2Fen%2Fportal%2Fdocuments'));
  await go(page, '/admin/leads');
  check('admin redirects signed-out visitors to login', page.url().includes('/admin/login?next=%2Fadmin%2Fleads'));
  const exp = await page.request.get(`${ORIGIN}/api/admin/leads/export`);
  check('CSV export refuses anonymous', exp.status() === 403);
  const dl = await page.request.get(`${ORIGIN}/api/portal/documents/d1`);
  check('document download refuses anonymous', dl.status() === 401);
  check('portal login is noindex', (await page.request.get(`${ORIGIN}/en/portal/login`)).headers()['x-robots-tag']?.includes('noindex'));
  await ctx.close();
}

// ---- Student portal ----------------------------------------------------------------------
const student = await newPage();
{
  const { page } = student;
  await signIn(page, 'portal', 'student');
  check('student lands on dashboard', await visible(page, '.tracker'));
  check('tracker shows current stage', (await page.locator('.tracker .is-current').innerText()).includes('Offer received'));
  check('history listed', (await page.locator('.portal-history li').count()) >= 2);
  const unread = Number(await page.locator('.portal-nav .portal-count').innerText());
  check('unread badge', unread >= 2, `${unread}`);
  await page.screenshot({ path: OUT + 'p6-portal-dashboard.png', fullPage: true });

  await page.getByRole('link', { name: 'Documents' }).first().click();
  await page.waitForURL(/\/portal\/documents/);
  await visible(page, '.doc-checklist');
  check('checklist shows re-upload request', (await page.locator('.doc-checklist li.is-reupload_needed').count()) === 1);
  check('counsellor comment visible', (await page.locator('.doc-comment').first().innerText()).includes('cut off'));

  // Disguised executable → refused by magic-byte check.
  await page.locator('select[name=doc_type]').selectOption('cv');
  await page.locator('input[type=file]').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MZ\x90\x00 this is not a pdf') });
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  check('disguised file rejected', (await page.locator('.upload-form .form-error').innerText().catch(() => '')).includes('Only PDF'));

  // PDF with JavaScript → refused.
  await page.locator('input[type=file]').setInputFiles({ name: 'evil.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n<</OpenAction<</S/JavaScript/JS(app.alert(1))>>>>\n%%EOF') });
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await page.waitForTimeout(500);
  check('PDF with scripts rejected', (await page.locator('.upload-form .form-error').innerText().catch(() => '')).includes('scripts'));

  // Valid re-upload of the English test result.
  const before = await page.locator('.doc-list li').count();
  await page.locator('select[name=doc_type]').selectOption('english');
  await page.locator('input[type=file]').setInputFiles({ name: 'IELTS full TRF.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF') });
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  check('upload succeeds', await visible(page, '.upload-done'));
  await page.waitForFunction((n) => document.querySelectorAll('.doc-list li').length > n, before, { timeout: 15000 }).catch(() => {});
  check('new upload listed as pending', (await page.locator('.doc-list li').first().innerText()).includes('IELTS-full-TRF.pdf') && (await page.locator('.doc-list li').first().innerText()).includes('Pending'));
  check('re-upload slot now pending', (await page.locator('.doc-checklist li.is-reupload_needed').count()) === 0);
  await page.screenshot({ path: OUT + 'p6-portal-documents.png', fullPage: true });

  const href = await page.locator('.doc-list li').first().locator('a[href^="/api/portal/documents/"]').getAttribute('href');
  const res = await page.request.get(ORIGIN + href);
  check('own document downloads as attachment', res.status() === 200 && res.headers()['content-disposition']?.startsWith('attachment') && res.headers()['x-content-type-options'] === 'nosniff');
  check('unknown document → 404', (await page.request.get(`${ORIGIN}/api/portal/documents/not-a-real-id`)).status() === 404);

  // Remove the just-uploaded (pending) document, then upload again so the admin has something to review.
  await page.locator('.doc-list li').first().locator('form button').click();
  check('student can remove a pending upload', await until(page, async () => !(await page.locator('.doc-list').innerText()).includes('IELTS-full-TRF.pdf')));
  await page.locator('select[name=doc_type]').selectOption('english');
  await page.locator('input[type=file]').setInputFiles({ name: 'IELTS TRF.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await visible(page, '.upload-done');

  await go(page, '/en/portal/pre-departure');
  check('pre-departure locked before visa', await visible(page, '.portal-locked'));

  await go(page, '/en/portal/notifications');
  check('deadline notification shown', (await page.locator('.notice.is-deadline').count()) >= 1);
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  check('mark all read clears badge', await until(page, async () => (await page.locator('.portal-nav .portal-count').count()) === 0));

  await go(page, '/admin');
  check('student cannot open admin', page.url().includes('/admin/login'));
  check('admin login explains why', (await page.locator('.form-error').first().innerText().catch(() => '')).includes('staff access'));

  await go(page, '/ne/portal');
  check('portal in Nepali', (await page.locator('.portal-head h1').innerText()).includes('नमस्ते'));
}

// ---- Admin dashboard -------------------------------------------------------------------
const admin = await newPage();
{
  const { page } = admin;
  await signIn(page, 'admin', 'admin');
  check('admin overview', await visible(page, '.stat-grid'));
  check('pending docs counted', Number(await page.locator('.stat-tile').nth(3).locator('strong').innerText()) >= 1);
  await page.screenshot({ path: OUT + 'p6-admin-overview.png', fullPage: true });

  await go(page, '/admin/leads?status=new');
  const newCount = await page.locator('.admin-table tbody tr').count();
  check('lead status filter', newCount >= 1 && (await page.locator('.admin-table .badge').allInnerTexts()).every((t) => t === 'New'));
  await go(page, '/admin/leads?q=Anjali');
  check('lead search', (await page.locator('.admin-table tbody tr').count()) === 1);
  await page.locator('.admin-table tbody a').first().click();
  await page.waitForURL(/\/admin\/leads\/.+/);
  await page.fill('textarea[name=body]', 'E2E: called back, sending Canada checklist.');
  await page.getByRole('button', { name: 'Add note' }).click();
  check('note added', await until(page, async () => (await page.locator('.note-list').innerText()).includes('E2E: called back')));
  await page.getByRole('button', { name: 'Mark qualified' }).click();
  check('lead status updated', await until(page, async () => (await page.locator('aside .badge').innerText()) === 'Qualified'));

  const csv = await page.request.get(`${ORIGIN}/api/admin/leads/export?status=qualified`);
  const body = await csv.text();
  check('CSV export', csv.headers()['content-type']?.includes('text/csv') && body.includes('Anjali Thapa') && body.split('\r\n').length >= 2);

  await go(page, '/admin/availability');
  await page.fill('form:has(button:has-text("Add closure")) input[name=date]', new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  await page.fill('form:has(button:has-text("Add closure")) input[name=reason]', 'E2E staff training');
  await page.getByRole('button', { name: 'Add closure' }).click();
  check('closure added', await until(page, async () => (await page.locator('.admin-list').first().innerText()).includes('E2E staff training')));

  await go(page, '/admin/bookings');
  check('bookings page', await visible(page, '.admin-tabs'));

  await go(page, '/admin/applications');
  await page.locator('.admin-table a', { hasText: 'Aarav Sharma' }).click();
  await page.waitForURL(/\/admin\/applications\/.+/);
  await visible(page, '.doc-review-list');
  const pendingItem = page.locator('.doc-review-list > li', { hasText: 'IELTS-TRF.pdf' });
  check('student upload visible to staff', (await pendingItem.count()) === 1);
  await pendingItem.getByRole('button', { name: 'Verify' }).click();
  check('document verified', await until(page, async () => (await page.locator('.doc-review-list > li', { hasText: 'IELTS-TRF.pdf' }).innerText()).includes('Verified')));
  await page.locator('form:has(button:has-text("Update stage")) select[name=stage]').selectOption('visa_granted');
  await page.fill('input[name=note]', 'Visa approved — congratulations!');
  await page.getByRole('button', { name: 'Update stage' }).click();
  check('stage updated', await until(page, async () => (await page.locator('.tracker .is-current').innerText()).includes('Visa granted')));
  await page.screenshot({ path: OUT + 'p6-admin-application.png', fullPage: true });

  await go(page, '/admin/users');
  check('users page for admin', (await page.locator('.admin-table').count()) === 2);
  await go(page, '/admin/content');
  check('content page', (await page.locator('.content-grid .admin-card').count()) >= 8);
}

// ---- Student sees the admin's changes --------------------------------------------------
{
  const { page } = student;
  await go(page, '/en/portal');
  check('student sees new stage', (await page.locator('.tracker .is-current').innerText()).includes('Visa granted'));
  check('pre-departure unlocked banner', await visible(page, '.portal-banner'));
  check('stage notification arrived', Number(await page.locator('.portal-nav .portal-count').innerText().catch(() => '0')) >= 2);
  await go(page, '/en/portal/pre-departure');
  check('pre-departure checklist', (await page.locator('.pre-card').count()) >= 3);
  await page.screenshot({ path: OUT + 'p6-portal-predeparture.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(/\/portal\/login/);
  await go(page, '/en/portal');
  check('sign out ends the session', page.url().includes('/portal/login'));
}

// ---- Counsellor role -------------------------------------------------------------------
{
  const { ctx, page } = await newPage();
  await signIn(page, 'admin', 'counsellor');
  check('counsellor reaches admin', await visible(page, '.stat-grid'));
  check('counsellor has no Users link', (await page.locator('.admin-nav a', { hasText: 'Users' }).count()) === 0);
  await go(page, '/admin/users');
  check('counsellor blocked from users page', page.url().includes('error=admin_only'));
  await ctx.close();
}

// ---- Mobile layouts ----------------------------------------------------------------------
{
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await signIn(page, 'portal', 'student');
  const o1 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('portal fits mobile', o1 <= 0, `${o1}px`);
  await page.screenshot({ path: OUT + 'p6-portal-mobile.png', fullPage: true });
  await go(page, '/admin/login');
  await page.context().clearCookies();
  await signIn(page, 'admin', 'admin');
  const o2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('admin fits mobile', o2 <= 0, `${o2}px`);
  await page.screenshot({ path: OUT + 'p6-admin-mobile.png', fullPage: true });
  await ctx.close();
}

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\nScreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
