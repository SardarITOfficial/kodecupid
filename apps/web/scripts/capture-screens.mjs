import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

/**
 * Captures handover screenshots of the running app.
 *   pnpm --filter web exec node scripts/capture-screens.mjs
 */
const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const out = new URL('../../../docs/screens/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const debugCode = process.env.OTP_DEBUG_CODE ?? '246810';

await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desktop.goto(`${base}/`, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: `${out}/01-landing.png` });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await mobile.goto(`${base}/register`, { waitUntil: 'networkidle' });
await mobile.screenshot({ path: `${out}/02-register-mobile.png` });

// ── A seeded member's profile (complete profile with photos) ────────────────
const member = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await member.goto(`${base}/login`, { waitUntil: 'networkidle' });
await member.getByLabel('Country').selectOption('BD');
await member.getByLabel('Phone number').fill('1711000001');
await member.getByRole('button', { name: 'Send sign-in code' }).click();
await member.waitForURL(/\/verify/, { timeout: 30_000 });
await member.getByLabel('Verification code').fill(debugCode);
await member.getByRole('button', { name: 'Verify and continue' }).click();
await member.waitForURL(/\/app/, { timeout: 30_000 });
await member.goto(`${base}/profile`, { waitUntil: 'networkidle' });
await member.waitForTimeout(1200);
await member.screenshot({ path: `${out}/03-member-profile-mobile.png`, fullPage: true });

// ── Admin area, both roles ──────────────────────────────────────────────────
async function loginAs(email, password, viewport = { width: 1440, height: 960 }) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/admin\/users/, { timeout: 30_000 });
  await page.waitForSelector('tbody tr', { timeout: 30_000 });
  await page.waitForTimeout(600);
  return page;
}

const superAdmin = await loginAs('admin@kodecupid.test', 'ChangeMe!Admin1');
await superAdmin.screenshot({ path: `${out}/04-admin-users-super-admin.png` });

const moderator = await loginAs('moderator@kodecupid.test', 'ChangeMe!Mod1');
await moderator.screenshot({ path: `${out}/05-admin-users-moderator.png` });

await browser.close();
console.log(`Screenshots written to ${out}`);
