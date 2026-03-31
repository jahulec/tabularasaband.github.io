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
      await expect.poll(() =>
        page.evaluate(() => ({
          bodyLocked: document.body.classList.contains('scroll-locked'),
          htmlLocked: document.documentElement.classList.contains('scroll-locked'),
        }))
      ).toEqual({ bodyLocked: false, htmlLocked: false });

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

test('mobile nav responds to touch swipe open and close', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const target = document.documentElement;
    const dispatchTouchPointer = (type, x, y) => {
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
      }));
    };

    dispatchTouchPointer('pointerdown', 12, 120);
    dispatchTouchPointer('pointermove', 112, 120);
    dispatchTouchPointer('pointerup', 112, 120);
  });

  await expect(page.locator('#nav-mobile')).toHaveClass(/active/);

  await page.evaluate(() => {
    const target = document.querySelector('.mobile-nav-panel');
    const dispatchTouchPointer = (type, x, y) => {
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
      }));
    };

    dispatchTouchPointer('pointerdown', window.innerWidth - 20, 180);
    dispatchTouchPointer('pointermove', window.innerWidth - 120, 180);
    dispatchTouchPointer('pointerup', window.innerWidth - 120, 180);
  });

  await expect(page.locator('#nav-mobile')).not.toHaveClass(/active/);
});

test.describe('Smoke: past shows are hidden after the event day', () => {
  for (const path of ['/shows.html', '/shows-en.html']) {
    test(`expired shows disappear on the next day: ${path}`, async ({ page }) => {
      await page.addInitScript(() => {
        const RealDate = Date;
        const fixedNow = new RealDate('2026-03-28T12:00:00');

        class MockDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedNow.getTime());
              return;
            }

            super(...args);
          }

          static now() {
            return fixedNow.getTime();
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        window.Date = MockDate;
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const visibleShows = await page.evaluate(() => (
        Array.from(document.querySelectorAll('.shows-list .concert-item'))
          .filter((item) => !item.hidden)
          .length
      ));

      expect(visibleShows).toBe(0);
      await expect(page.locator('.shows-empty-state')).toBeVisible();
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
