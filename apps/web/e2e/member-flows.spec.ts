import { expect, test } from '@playwright/test';

/**
 * The client's Definition of Done, exercised through the browser:
 * register → age gate + Terms + Guidelines + Safety Tips → guided onboarding
 * (with a required photo) → profile → privacy → settings, plus the admin roles.
 */
const DEBUG_CODE = process.env.OTP_DEBUG_CODE ?? '246810';
const PHOTO_FIXTURE = 'public/icon-192.png';

function randomNationalNumber(): string {
  // 10-digit Bangladeshi mobile number that libphonenumber accepts.
  const suffix = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
  return `17${suffix}`;
}

async function acceptAllDocuments(page: import('@playwright/test').Page): Promise<void> {
  await page.getByLabel(/I confirm that I am/).check();
  await page.getByLabel(/I accept the Terms of Service/).check();
  await page.getByLabel(/I accept the Community Guidelines/).check();
  await page.getByLabel(/I accept the Safety Tips/).check();
}

test('member can register, accept the terms, finish onboarding and review privacy', async ({
  page,
}) => {
  const phone = randomNationalNumber();

  await page.goto('/register');
  await page.getByLabel('Country').selectOption('BD');
  await page.getByLabel('Phone number').fill(phone);
  await page.getByRole('button', { name: 'Send my code' }).click();

  await expect(page).toHaveURL(/\/verify/);
  await page.getByLabel('Verification code').fill(DEBUG_CODE);
  await page.getByRole('button', { name: 'Verify and continue' }).click();

  // ── Age gate + three legal documents ──────────────────────────────────
  await expect(page).toHaveURL(/\/compliance/);
  await page.getByLabel('Date of birth').fill('1995-05-05');
  await acceptAllDocuments(page);
  await page.getByRole('button', { name: 'Continue to setup' }).click();

  // ── Onboarding ─────────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/onboarding\/welcome/);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding\/identity/);
  await page.getByLabel('Display name').fill('Playwright Tester');
  await page.getByRole('button', { name: 'Woman', exact: true }).click();
  await page.getByRole('button', { name: 'Men', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding\/profession/);
  await page.getByRole('button', { name: 'Healthcare', exact: true }).click();
  await page.getByLabel('Job title').fill('Registered Nurse');
  await page.getByRole('button', { name: 'Night shift' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding\/location/);
  await page.getByLabel('City').fill('Atlanta');
  await page.getByLabel('State / province').fill('Georgia');
  await page.getByLabel('Country').selectOption('US');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding\/preferences/);
  await page.getByRole('button', { name: 'Long-term relationship' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/onboarding\/privacy/);
  await page.getByRole('button', { name: 'Continue to finish' }).click();

  // ── Completion requires at least one photo ────────────────────────────
  await expect(page).toHaveURL(/\/onboarding\/complete/);
  await expect(page.getByRole('button', { name: 'Add a photo to continue' })).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles(PHOTO_FIXTURE);
  await expect(page.getByRole('button', { name: 'Enter KodeCupid' })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Enter KodeCupid' }).click();

  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByText(/Hi Playwright/)).toBeVisible();

  // ── Profile + privacy ──────────────────────────────────────────────────
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Playwright Tester' })).toBeVisible();
  await expect(page.getByText('Healthcare').first()).toBeVisible();

  await page.goto('/profile/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy controls' })).toBeVisible();
  await page.getByRole('switch', { name: 'Religion' }).click();
  await expect(page.getByText(/Religion is now visible|Religion is now hidden/)).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('admin roles see different navigation and permissions', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Work email').fill(process.env.SEED_MODERATOR_EMAIL ?? 'moderator@kodecupid.test');
  await page.getByLabel('Password').fill(process.env.SEED_MODERATOR_PASSWORD ?? 'ChangeMe!Mod1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Roles & access' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Activity log' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);

  // The Moderator can open a queue they own…
  await page.goto('/admin/complaints');
  await expect(page.getByRole('heading', { name: 'Complaints' })).toBeVisible();

  // …but not the Super Admin-only areas, even by typing the URL.
  await page.goto('/admin/roles');
  await expect(
    page.getByRole('heading', { name: 'Role management is Super Admin only' }),
  ).toBeVisible();

  await page.goto('/admin/audit');
  await expect(
    page.getByRole('heading', { name: 'Activity log is Super Admin only' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel('Work email').fill(process.env.SEED_ADMIN_EMAIL ?? 'admin@kodecupid.test');
  await page.getByLabel('Password').fill(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!Admin1');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole('link', { name: 'Roles & access' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Activity log' })).toBeVisible();

  await page.getByRole('link', { name: 'Roles & access' }).click();
  await expect(page.getByRole('heading', { name: 'Roles & access' })).toBeVisible();

  await page.getByRole('link', { name: 'Activity log' }).click();
  await expect(page.getByRole('heading', { name: 'Activity log' })).toBeVisible();
});

test('under-18 visitors are blocked at the age gate', async ({ page }) => {
  const phone = randomNationalNumber();

  await page.goto('/register');
  await page.getByLabel('Country').selectOption('BD');
  await page.getByLabel('Phone number').fill(phone);
  await page.getByRole('button', { name: 'Send my code' }).click();

  await page.getByLabel('Verification code').fill(DEBUG_CODE);
  await page.getByRole('button', { name: 'Verify and continue' }).click();

  await expect(page).toHaveURL(/\/compliance/);

  const underage = new Date();
  underage.setUTCFullYear(underage.getUTCFullYear() - 17);
  await page.getByLabel('Date of birth').fill(underage.toISOString().slice(0, 10));
  await acceptAllDocuments(page);
  await page.getByRole('button', { name: 'Continue to setup' }).click();

  await expect(page.getByText('KodeCupid is for adults only')).toBeVisible();
});

test('marketing, auth and admin screens are usable at 360px with no console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.setViewportSize({ width: 360, height: 740 });

  for (const path of ['/', '/register', '/login', '/admin/login']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows, `${path} must not scroll horizontally at 360px`).toBe(false);
  }

  expect(errors).toEqual([]);
});
