import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

// Benign console noise to ignore (Phaser/WebGL chatter in headless, missing art).
const IGNORE = [
  /favicon/i,
  /Download the .* DevTools/i,
  /WebGL/i,
  /Phaser/i,
  /\.png/i,
  /\.webp/i,
  /Failed to load resource/i,
];

/**
 * Drive one renovation module to mastery, starting from its room screen (its
 * hotspot must be available). Leaves the page on the transform screen. The
 * decide beat is a hard gate + retry, and the recommended option is deliberately
 * not identifiable by position, so we cycle options until it passes.
 */
async function completeModule(page: Page, projectId: string): Promise<void> {
  await page.locator(`[data-testid="hotspot"][data-project-id="${projectId}"]`).click();
  await expect(page.getByTestId('module')).toHaveAttribute('data-step', 'learn');
  await page.getByTestId('learn-continue').click();
  await expect(page.getByTestId('module')).toHaveAttribute('data-step', 'decide');

  for (let i = 0; i < 6; i++) {
    const count = await page.getByTestId('choice').count();
    if (count === 0) break;
    await page
      .getByTestId('choice')
      .nth(i % count)
      .click();
    await expect(page.getByTestId('result-marker')).toBeVisible();
    if (
      await page
        .getByTestId('to-transform')
        .isVisible()
        .catch(() => false)
    )
      break;
    await page.getByTestId('retry').click();
  }
  await page.getByTestId('to-transform').click();
  await expect(page.getByTestId('transform')).toBeVisible();
}

test('explore → gated discovery → two modules → the room is renovated (and persists)', async ({
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

  // House view: rooms, meter, and the illustrative resource HUD.
  await expect(page.getByTestId('house')).toBeVisible();
  await expect(page.getByTestId('house-meter')).toContainText('0/2');
  await expect(page.getByTestId('resource-bars')).toBeVisible();

  // Enter the Salón.
  await page.locator('[data-testid="room-tile"][data-room-id="salon"]').click();
  await expect(page.getByTestId('room')).toBeVisible();
  await expect(page.getByTestId('room-art')).toHaveAttribute('data-state', 'untouched');

  // Lighting is gated behind flooring: its hotspot starts locked + disabled.
  const light = page.locator('[data-testid="hotspot"][data-project-id="salon-lighting"]');
  await expect(light).toHaveAttribute('data-locked', 'true');
  await expect(light).toBeDisabled();

  // Module 1 — flooring. One of two projects → room still in progress.
  await completeModule(page, 'salon-flooring');
  await page.getByTestId('back-to-room').click();
  await expect(
    page.locator('[data-testid="hotspot"][data-project-id="salon-lighting"]'),
  ).toHaveAttribute('data-locked', 'false');

  // Module 2 — lighting. Now the room is fully renovated.
  await completeModule(page, 'salon-lighting');
  await expect(page.getByTestId('room-art')).toHaveAttribute('data-state', 'renovated');

  // Back to house: the meter ticks up, and it persists across reload.
  await page.getByTestId('back-to-house').click();
  await expect(page.getByTestId('house-meter')).toContainText('1/2');
  await page.reload();
  await expect(page.getByTestId('house-meter')).toContainText('1/2');

  expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
});
