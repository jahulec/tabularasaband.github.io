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

  await page.evaluate(() => {
    const target = document.documentElement;
    const dispatchTouch = (type, x, y) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', {
        value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
      });
      target.dispatchEvent(event);
    };

    dispatchTouch('touchstart', window.innerWidth - 8, 160);
    dispatchTouch('touchmove', window.innerWidth - 116, 160);
    dispatchTouch('touchend', window.innerWidth - 116, 160);
  });

  await expect(page.locator('#nav-mobile')).toHaveClass(/active/);

  await page.evaluate(() => {
    const target = document.querySelector('.mobile-nav-panel');
    const dispatchTouch = (type, x, y) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', {
        value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
      });
      target.dispatchEvent(event);
    };

    dispatchTouch('touchstart', window.innerWidth - 130, 200);
    dispatchTouch('touchmove', window.innerWidth - 18, 200);
    dispatchTouch('touchend', window.innerWidth - 18, 200);
  });

  await expect(page.locator('#nav-mobile')).not.toHaveClass(/active/);
});

test.describe('Smoke: mobile nav swipe works across pages', () => {
  for (const path of ['/index.html', '/music.html', '/shows.html', '/gallery.html']) {
    test(`right-side touch swipe opens menu: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      await page.evaluate(() => {
        const target = document.body;
        const dispatchTouch = (type, x, y) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(event, 'touches', {
            value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
          });
          target.dispatchEvent(event);
        };

        dispatchTouch('touchstart', window.innerWidth - 76, 220);
        dispatchTouch('touchmove', window.innerWidth - 144, 220);
        dispatchTouch('touchend', window.innerWidth - 144, 220);
      });

      await expect(page.locator('#nav-mobile')).toHaveClass(/active/);
    });
  }
});

test.describe('Smoke: past shows are dimmed after the event day', () => {
  for (const path of ['/shows.html', '/shows-en.html']) {
    test(`expired shows stay visible with inactive styling: ${path}`, async ({ page }) => {
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
      await page.waitForSelector('.shows-empty-state', { state: 'attached' });

      const showStates = await page.evaluate(() => {
        const shows = Array.from(document.querySelectorAll('.shows-list .concert-item'));
        return {
          total: shows.length,
          visible: shows.filter((item) => !item.hidden).length,
          past: shows.filter((item) => item.classList.contains('is-past-show')).length,
          orderedDates: shows.map((item) => item.getAttribute('data-show-date')),
          march27Past: document.querySelector('[data-show-date="2026-03-27"]')?.classList.contains('is-past-show'),
          march28Past: document.querySelector('[data-show-date="2026-03-28"]')?.classList.contains('is-past-show'),
          emptyHidden: document.querySelector('.shows-empty-state')?.hidden,
        };
      });

      expect(showStates.total).toBe(30);
      expect(showStates.visible).toBe(30);
      expect(showStates.past).toBe(14);
      expect(showStates.orderedDates.slice(0, 4)).toEqual([
        '2026-03-28',
        '2026-04-11',
        '2026-04-18',
        '2026-05-16',
      ]);
      expect(showStates.orderedDates.slice(-3)).toEqual([
        '2026-01-30',
        '2026-01-16',
        '2026-01-09',
      ]);
      expect(showStates.march27Past).toBe(true);
      expect(showStates.march28Past).toBe(false);
      expect(showStates.emptyHidden).toBe(true);
    });
  }
});

test('home upcoming shows match the shows page ordering for the generated date', async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    const fixedNow = new RealDate('2026-06-27T12:00:00');

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

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.home-show');
  const homeDates = await page.$$eval('.home-show', (items) =>
    items.map((item) => item.getAttribute('data-show-date'))
  );

  await page.goto('/shows.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.shows-empty-state', { state: 'attached' });
  await page.waitForTimeout(250);
  const showsDates = await page.$$eval('.shows-list .concert-item', (items) =>
    items.slice(0, 5).map((item) => item.getAttribute('data-show-date'))
  );

  expect(homeDates.length).toBeLessThanOrEqual(5);
  expect(homeDates).toEqual(showsDates.slice(0, homeDates.length));
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

test.describe('Smoke: gallery modal navigation', () => {
  for (const path of ['/gallery.html', '/gallery-en.html']) {
    test(`gallery modal supports arrows and swipe/drag: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const firstImage = page.locator('.gallery-grid img').first();
      const modalImage = page.locator('#expandedImage');

      await expect(firstImage).toBeVisible();
      await firstImage.click();
      await expect(page.locator('#expandedImageContainer')).toBeVisible();

      const firstSrc = await modalImage.evaluate((img) => img.getAttribute('src'));
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => modalImage.evaluate((img) => img.getAttribute('src'))).not.toBe(firstSrc);

      const secondSrc = await modalImage.evaluate((img) => img.getAttribute('src'));
      await page.keyboard.press('ArrowLeft');
      await expect.poll(() => modalImage.evaluate((img) => img.getAttribute('src'))).toBe(firstSrc);

      await page.evaluate(() => {
        const target = document.getElementById('expandedImage');
        const dispatchPointer = (type, x, y, pointerType = 'mouse') => {
          target.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerId: 7,
            pointerType,
            isPrimary: true,
          }));
        };

        dispatchPointer('pointerdown', 760, 420);
        dispatchPointer('pointermove', 680, 420);
        dispatchPointer('pointerup', 680, 420);
      });

      await expect.poll(() => modalImage.evaluate((img) => img.getAttribute('src'))).toBe(secondSrc);
    });
  }
});

test.describe('Smoke: mobile gallery modal swipe', () => {
  for (const path of ['/gallery.html', '/gallery-en.html']) {
    test(`mobile gallery modal uses swipe without visible buttons: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const firstImage = page.locator('.gallery-grid img').first();
      const modalImage = page.locator('#expandedImage');

      await expect(firstImage).toBeVisible();
      await firstImage.click();
      await expect(page.locator('#expandedImageContainer')).toBeVisible();
      await expect(page.locator('.gallery-modal-nav')).toHaveCount(2);
      await expect(page.locator('.gallery-modal-nav').first()).toBeHidden();

      const firstSrc = await modalImage.evaluate((img) => img.getAttribute('src'));

      await page.evaluate(() => {
        const target = document.getElementById('expandedImage');
        const dispatchTouch = (type, x, y) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(event, 'touches', {
            value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
          });
          target.dispatchEvent(event);
        };

        dispatchTouch('touchstart', 310, 410);
        dispatchTouch('touchmove', 180, 410);
        dispatchTouch('touchend', 180, 410);
      });

      await expect.poll(() => modalImage.evaluate((img) => img.getAttribute('src'))).not.toBe(firstSrc);
    });
  }
});
