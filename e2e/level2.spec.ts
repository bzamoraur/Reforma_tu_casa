import { expect, test, type ConsoleMessage } from '@playwright/test';

// Benign console noise to ignore (none expected, but keep the e2e robust).
const IGNORE = [/favicon/i, /Download the .* DevTools/i];

test('completes Level 2 end-to-end, shows the scorecard, and persists progress', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !IGNORE.some((re) => re.test(msg.text()))) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // The menu offers Level 2 directly; start it.
  const start = page.locator('[data-testid="start-level"][data-level-id="level-2"]');
  await expect(start).toBeVisible();
  await start.click();

  // Decide every scenario until the audit screen appears.
  for (let i = 0; i < 12; i++) {
    if (
      await page
        .getByTestId('audit')
        .isVisible()
        .catch(() => false)
    )
      break;
    await expect(page.getByTestId('scenario')).toBeVisible();
    await page.getByTestId('choice').first().click();
    await expect(page.getByTestId('feedback')).toBeVisible();
    await page.getByTestId('next').click();
  }

  // Audit: review all red flags, generate the checklist, finish.
  await expect(page.getByTestId('audit')).toBeVisible();
  for (let i = 0; i < 30; i++) {
    const pending = page.locator('[data-testid="review-flag"]:not([disabled])');
    if ((await pending.count()) === 0) break;
    await pending.first().click();
  }
  await page.getByTestId('generate-audit').click();
  const finish = page.getByTestId('finish-level');
  await expect(finish).toBeEnabled();
  await finish.click();

  // Scorecard appears.
  await expect(page.getByTestId('scorecard')).toBeVisible();

  // Progress persists across a reload.
  await page.reload();
  await expect(
    page.locator('[data-testid="progress-badge"][data-level-id="level-2"]'),
  ).toBeVisible();

  expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
});
