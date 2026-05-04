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

  // W8 · E1 shareable URLs: theme persists via ?theme= query param.
  test('theme swap persists via ?theme= URL', async ({ page }) => {
    await page.goto('/?theme=bubblegum');

    // Server renders first-pill aria-checked=true, but client script
    // should overwrite it from the URL on load.
    const bubblegum = page.getByRole('radio', { name: /bubblegum/i });
    await expect(bubblegum).toHaveAttribute('aria-checked', 'true');

    // The frame's data-theme should match the URL choice.
    const figure = page.locator('[data-theme-target]');
    await expect(figure).toHaveAttribute('data-theme', 'bubblegum');

    // Clicking a different swatch should update ?theme= (replaceState).
    const claude = page.getByRole('radio', { name: /claude/i });
    await claude.click();
    await expect(page).toHaveURL(/[?&]theme=claude\b/);
  });

  // W8 · D-11 search route: client-side filter, status region updates.
  test('search route filters 22 packs live + persists via ?q=', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Find a pack.' })).toBeVisible();

    const allRows = page.locator('.search__row');
    await expect(allRows).toHaveCount(22);

    const input = page.getByRole('searchbox');
    await input.fill('cornell');

    // Status copy reflects filtered count
    await expect(page.locator('#search-status')).toContainText(/Showing 1 of 22/);
    await expect(page).toHaveURL(/[?&]q=cornell\b/);

    // The visible rows (not [hidden]) should be exactly 1.
    const visibleRows = page.locator('.search__row:not([hidden])');
    await expect(visibleRows).toHaveCount(1);
    await expect(visibleRows.first()).toContainText(/Cornell Notes/i);

    // No-match path
    await input.fill('zzz-nothing-matches-this');
    await expect(page.locator('#search-empty')).toBeVisible();
  });

  // W8 · ?q= persists across reloads (deep-link contract).
  test('search ?q= re-hydrates on page load', async ({ page }) => {
    await page.goto('/search?q=habit');
    const input = page.getByRole('searchbox');
    await expect(input).toHaveValue('habit');
    await expect(page.locator('#search-status')).toContainText(/Showing \d+ of 22/);
  });

  // W10 · E4 · OG cards wired. Every pack page surfaces an og:image
  // pointing at the 1200×630 card the sharp pipeline emits.
  test('pack detail sets og:image + twitter:image to pack OG card', async ({ page }) => {
    await page.goto('/packs/prax-journal');
    const og = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    const tw = await page
      .locator('meta[name="twitter:image"]')
      .getAttribute('content');
    expect(og).toContain('/og/prax-journal/');
    expect(og).toMatch(/\.png$/);
    expect(tw).toEqual(og);

    // Dimensions claimed by the page must match the emitted file.
    await expect(
      page.locator('meta[property="og:image:width"]'),
    ).toHaveAttribute('content', '1200');
    await expect(
      page.locator('meta[property="og:image:height"]'),
    ).toHaveAttribute('content', '630');

    // OG image URL: the meta tag serializes as an absolute URL against
    // the site's canonical domain (pretext-templates.dev) since that's
    // what Astro.site is set to. Social unfurlers need absolute; tests
    // hit the local preview server, so translate to a same-origin path
    // before probing the asset.
    if (og) {
      const pathname = new URL(og).pathname;
      const res = await page.request.get(pathname);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type'] ?? '').toContain('image/png');
    }
  });

  test('home uses the default og:image + card has summary_large_image type', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('meta[property="og:image"]'),
    ).toHaveAttribute('content', /\/og\/default\.png$/);
    await expect(
      page.locator('meta[name="twitter:card"]'),
    ).toHaveAttribute('content', 'summary_large_image');
  });
});
