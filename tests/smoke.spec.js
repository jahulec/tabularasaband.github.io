const { test, expect } = require('@playwright/test');
const showsData = require('../data/shows.json').shows;

async function setNecessaryCookieConsent(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('tr_cookie_consent_v1', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
      version: '2026-02-25',
    }));
  });
}

const desktopPages = [
  '/index.html',
  '/index-en.html',
  '/about.html',
  '/about-en.html',
  '/shows.html',
  '/shows-en.html',
  '/music.html',
  '/music-en.html',
  '/news.html',
  '/news-en.html',
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
      await setNecessaryCookieConsent(page);
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

test.describe('Smoke: mobile edge swipe works across pages', () => {
  for (const path of ['/index.html', '/music.html', '/shows.html', '/gallery.html']) {
    test(`right-edge pointer swipe opens menu: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      await page.evaluate(() => {
        const target = document.body;
        const dispatchPointer = (type, x, y) => {
          target.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerId: 9,
            pointerType: 'touch',
            isPrimary: true,
          }));
        };

        dispatchPointer('pointerdown', window.innerWidth - 8, 220);
        dispatchPointer('pointermove', window.innerWidth - 92, 220);
        dispatchPointer('pointerup', window.innerWidth - 92, 220);
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

      const expectedPast = showsData.filter((show) => show.date < '2026-03-28').length;
      expect(showStates.total).toBe(showsData.length);
      expect(showStates.visible).toBe(showsData.length);
      expect(showStates.past).toBe(expectedPast);
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

test.describe('Smoke: landing keeps only nearest upcoming shows', () => {
  for (const path of ['/index.html', '/index-en.html']) {
    test(`past dates and status labels are absent on ${path}`, async ({ page }) => {
      await page.addInitScript(() => {
        const RealDate = Date;
        const fixedNow = new RealDate('2026-07-19T12:00:00+02:00');
        class MockDate extends RealDate {
          constructor(...args) {
            super(...(args.length ? args : [fixedNow.getTime()]));
          }
          static now() { return fixedNow.getTime(); }
          static parse(value) { return RealDate.parse(value); }
          static UTC(...args) { return RealDate.UTC(...args); }
        }
        window.Date = MockDate;
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        const list = document.querySelector('[data-home-shows]');
        const past = document.createElement('article');
        past.className = 'home-show runtime-past-show';
        past.dataset.showDate = '2026-07-18';
        past.innerHTML = '<time datetime="2026-07-18">18.07.2026</time><h3>Past fixture</h3>';
        list.prepend(past);
        window.initHomeShowsVisibility();
      });

      await expect(page.locator('.runtime-past-show')).toBeHidden();
      await expect(page.locator('.home-show-status')).toHaveCount(0);
      const visibleDates = await page.locator('[data-home-shows] .home-show:visible').evaluateAll((items) => (
        items.map((item) => item.getAttribute('data-show-date'))
      ));
      expect(visibleDates.length).toBeGreaterThan(0);
      expect(visibleDates.length).toBeLessThanOrEqual(3);
      expect(visibleDates.every((date) => date >= '2026-07-19')).toBe(true);
    });
  }
});

test.describe('News editorial reader', () => {
  for (const path of ['/news.html', '/news-en.html']) {
    test(`cards open and close the full-screen article: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const cards = page.locator('[data-news-open]');
      const reader = page.locator('[data-news-reader]');
      const grandPrixCard = page.locator('[data-news-open="grand-prix"]');
      await expect(cards).toHaveCount(5);
      await grandPrixCard.click();

      await expect(reader).toBeVisible();
      await expect(reader).toHaveClass(/is-active/);
      await expect(page.locator('[data-news-article="grand-prix"]')).toBeVisible();
      await expect(page.locator('#news')).toHaveAttribute('aria-hidden', 'true');
      await expect.poll(() => page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).overflowY,
        body: getComputedStyle(document.body).overflowY,
      }))).toEqual({ html: 'hidden', body: 'hidden' });
      const backTopBeforeScroll = await page.locator('[data-news-close]').evaluate(
        (button) => Math.round(button.getBoundingClientRect().top)
      );
      await reader.evaluate((element) => {
        element.scrollTop = 500;
      });
      const backTopAfterScroll = await page.locator('[data-news-close]').evaluate(
        (button) => Math.round(button.getBoundingClientRect().top)
      );
      expect(backTopAfterScroll).toBe(backTopBeforeScroll);

      await page.locator('[data-news-close]').click();
      await expect(reader).toBeHidden();
      await expect(page).not.toHaveURL(/#grand-prix$/);
      await expect(grandPrixCard).toBeFocused();
    });
  }

  test('a landing-page article hash opens the matching story and returns to the cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/news.html#progresja', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-news-reader]')).toBeVisible();
    await expect(page.locator('[data-news-article="progresja"]')).toBeVisible();
    await page.locator('[data-news-close]').click();
    await expect(page.locator('[data-news-reader]')).toBeHidden();
    await expect(page.locator('.news-hub-grid')).toBeVisible();
  });
});

test('home upcoming shows match the shows page ordering for the generated date', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.home-show');
  const homeDates = await page.$$eval('.home-show:not([hidden])', (items) =>
    items.map((item) => item.getAttribute('data-show-date'))
  );

  await page.goto('/shows.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.shows-empty-state', { state: 'attached' });
  await page.waitForTimeout(250);
  const showsDates = await page.$$eval('.shows-list .concert-item:not(.is-past-show)', (items) =>
    items.slice(0, 3).map((item) => item.getAttribute('data-show-date'))
  );

  expect(homeDates.length).toBeLessThanOrEqual(3);
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
