import { expect, test, type ConsoleMessage } from '@playwright/test';

// Benign console noise to ignore (Phaser/WebGL chatter in headless, missing art).
const IGNORE = [/favicon/i, /Download the .* DevTools/i, /WebGL/i, /Phaser/i, /\.png/i];

test('explore → discover → learn → decide → transform renovates a room', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !IGNORE.some((re) => re.test(msg.text()))) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // House view: rooms + meter.
  await expect(page.getByTestId('house')).toBeVisible();
  await expect(page.getByTestId('house-meter')).toContainText('0/2');

  // Enter the Salón.
  await page.locator('[data-testid="room-tile"][data-room-id="salon"]').click();
  await expect(page.getByTestId('room')).toBeVisible();
  await expect(page.getByTestId('room-art')).toHaveAttribute('data-state', 'untouched');

  // Discover the hotspot → learn.
  await page.locator('[data-testid="hotspot"][data-project-id="salon-flooring"]').click();
  await expect(page.getByTestId('module')).toHaveAttribute('data-step', 'learn');
  await page.getByTestId('learn-continue').click();
  await expect(page.getByTestId('module')).toHaveAttribute('data-step', 'decide');

  // Decide — hard gate + retry: cycle through options until the recommended one
  // passes (the correct option is deliberately not identifiable by position).
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

  // Transform: the room is renovated.
  await expect(page.getByTestId('transform')).toBeVisible();
  await expect(page.getByTestId('room-art')).toHaveAttribute('data-state', 'renovated');

  // Back to house: the meter ticks up, and it persists across reload.
  await page.getByTestId('back-to-house').click();
  await expect(page.getByTestId('house-meter')).toContainText('1/2');
  await page.reload();
  await expect(page.getByTestId('house-meter')).toContainText('1/2');

  expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
});
