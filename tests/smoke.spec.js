const { test, expect } = require('@playwright/test');

const desktopPages = [
  '/index.html',
  '/index-en.html',
  '/about.html',
  '/about-en.html',
  '/shows.html',
  '/shows-en.html',
  '/music.html',
  '/music-en.html',
  '/press.html',
  '/press-en.html',
  '/shop.html',
  '/shop-en.html',
  '/contact.html',
  '/contact-en.html',
  '/gallery.html',
  '/gallery-en.html',
];

test.describe('Smoke: scroll on all pages', () => {
  for (const path of desktopPages) {
    test(`desktop scroll works: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      // Startup auto-scroll animation needs to finish first.
      await page.waitForTimeout(1300);
      await page.evaluate(() => window.scrollTo(0, 0));

      const canScroll = await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 16
      );
      if (!canScroll) return;

      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(220);
      const after = await page.evaluate(() => window.scrollY);

      expect(after).toBeGreaterThan(before);
    });
  }
});

test.describe('Smoke: mobile menu lock/unlock', () => {
  const mobilePages = ['/index.html', '/shows.html', '/shows-en.html'];

  for (const path of mobilePages) {
    test(`mobile nav toggles scroll lock: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const hamburger = page.locator('#hamburger');
      const nav = page.locator('#nav-mobile');

      await expect(hamburger).toBeVisible();
      await hamburger.click();
      await expect(nav).toHaveClass(/active/);

      await hamburger.click();
      await expect(nav).not.toHaveClass(/active/);

      const canScroll = await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 16
      );
      if (!canScroll) return;

      await page.evaluate(() => window.scrollTo(0, 0));
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(220);
      const after = await page.evaluate(() => window.scrollY);
      expect(after).toBeGreaterThan(before);
    });
  }
});

test.describe('Smoke: gallery modal close restores scroll', () => {
  for (const path of ['/gallery.html', '/gallery-en.html']) {
    test(`gallery modal unlocks page scroll: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const firstImage = page.locator('.gallery-grid img').first();
      const modal = page.locator('#expandedImageContainer');

      await expect(firstImage).toBeVisible();
      await firstImage.click();
      await expect(modal).toBeVisible();

      await page.evaluate(() => {
        const modalElement = document.getElementById('expandedImageContainer');
        modalElement.click();
      });
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const el = document.getElementById('expandedImageContainer');
            return getComputedStyle(el).display;
          })
        )
        .toBe('none');

      await page.evaluate(() => window.scrollTo(0, 0));
      const before = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(220);
      const after = await page.evaluate(() => window.scrollY);
      expect(after).toBeGreaterThan(before);
    });
  }
});
