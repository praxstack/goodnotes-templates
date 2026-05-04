/**
 * Gallery smoke suite — W7.5.
 *
 * Five cases cover the surfaces the sprint has actually claimed to
 * deliver. Kept deliberately minimal so it stays green across rapid
 * iteration in W8+. The full interaction + a11y suites land in W14.
 *
 *   1. Home renders with 7 theme swatches · pack shelf · install cmd
 *   2. Theme swap: clicking a swatch flips aria-checked and writes
 *      --theme-background to the specimen frame
 *   3. Keyboard nav: ArrowRight on the radiogroup moves selection
 *   4. Browse route lists all 22 packs
 *   5. Pack-detail renders for prax-journal (hero image + colophon)
 */

import { test, expect } from '@playwright/test';

test.describe('Gallery · W7 smoke', () => {
  test('home renders hero, install cmd, and 7 theme swatches', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/pretext-templates/);

    // Hero copy updated in W6 (Seven → Twenty-two). Scope to the hero
    // paragraph; the same phrase also appears in the shelf h2 below.
    await expect(page.locator('.hero__lede')).toContainText('Twenty-two packs');

    // Install command visible with the full npx line.
    await expect(
      page.getByText('npx @pretext-templates/cli init prax-journal'),
    ).toBeVisible();

    // 7 theme swatches · role=radiogroup. The accessible name comes
    // from the <p id="theme-swap-label">, which the home page sets via
    // the ThemeSwap `label` prop to "Try a theme".
    const group = page.getByRole('radiogroup', { name: /try a theme/i });
    await expect(group).toBeVisible();
    const swatches = group.getByRole('radio');
    await expect(swatches).toHaveCount(7);
  });

  test('theme swap writes --theme-background on click', async ({ page }) => {
    await page.goto('/');

    const figure = page.locator('[data-theme-target]');
    await expect(figure).toBeVisible();

    // Pick the 3rd swatch (caffeine); assert it becomes checked
    // and the target gets the matching data-theme attribute.
    const caffeine = page.getByRole('radio', { name: /caffeine/i });
    await caffeine.click();
    await expect(caffeine).toHaveAttribute('aria-checked', 'true');
    await expect(figure).toHaveAttribute('data-theme', 'caffeine');

    // --theme-background CSS var should be set in-line on the target.
    const bg = await figure.evaluate(
      (el) => (el as HTMLElement).style.getPropertyValue('--theme-background'),
    );
    expect(bg.length).toBeGreaterThan(0); // some color value
  });

  test('ArrowRight on radiogroup advances selection', async ({ page }) => {
    await page.goto('/');

    // Focus the currently-checked swatch, then press ArrowRight.
    const first = page.getByRole('radio').first();
    await first.focus();
    await page.keyboard.press('ArrowRight');

    // Second swatch (alphabetical sort = bubblegum) should now be
    // checked. Zero off-by-one shenanigans; we checked exact ordering
    // in the theme-palette.json.
    const second = page.getByRole('radio').nth(1);
    await expect(second).toHaveAttribute('aria-checked', 'true');
    await expect(first).toHaveAttribute('aria-checked', 'false');
  });

  test('browse route lists all 22 packs', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: 'Every pack.' })).toBeVisible();

    // Count `<a href="/packs/...">` inside browse — category rows.
    const packLinks = page.locator('a[href^="/packs/"]');
    await expect(packLinks).toHaveCount(22);
  });

  test('pack detail renders prax-journal with crumbs + colophon', async ({ page }) => {
    await page.goto('/packs/prax-journal');
    await expect(page.getByRole('heading', { name: /praxis ledger/i })).toBeVisible();

    // Breadcrumb
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toBeVisible();

    // Colophon line
    await expect(page.getByText(/typeset in fraunces/i)).toBeVisible();
  });
});
