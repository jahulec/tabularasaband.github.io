const { test, expect } = require('@playwright/test');

test.describe('UI/UX a11y regressions', () => {
  test('all embedded iframes have non-empty title', async ({ page }) => {
    const pages = ['/index.html', '/index-en.html', '/music.html', '/music-en.html', '/mapa.html'];

    for (const path of pages) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const missingTitles = await page.$$eval('iframe', (frames) =>
        frames
          .filter((frame) => !(frame.getAttribute('title') || '').trim())
          .map((frame) => frame.getAttribute('src') || '')
      );

      expect(missingTitles, `Missing iframe title on ${path}`).toEqual([]);
    }
  });

  test('gallery modal behaves as accessible dialog and traps focus', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/gallery.html', { waitUntil: 'domcontentloaded' });

    const firstImage = page.locator('.gallery-grid img').first();
    const modal = page.locator('#expandedImageContainer');

    await expect(firstImage).toBeVisible();
    await firstImage.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    const modalAtBodyRoot = await page.evaluate(() => {
      const element = document.getElementById('expandedImageContainer');
      return !!element && element.parentElement === document.body;
    });
    expect(modalAtBodyRoot).toBeTruthy();

    await page.keyboard.press('Tab');
    const focusInsideModal = await page.evaluate(() => {
      const active = document.activeElement;
      return !!active && !!active.closest('#expandedImageContainer');
    });
    expect(focusInsideModal).toBeTruthy();

    const footerVisibleOverModal = await page.evaluate(() => {
      const hit = document.elementFromPoint(Math.floor(window.innerWidth / 2), window.innerHeight - 8);
      return !!hit && !!hit.closest('footer.shop-footer');
    });
    expect(footerVisibleOverModal).toBeFalsy();
  });

  test('home page presents the band landing sections without overflowing on mobile', async ({ page }) => {
    const checks = [
      { path: '/index.html', newsTitlePattern: /^Co nowego$/ },
      { path: '/index-en.html', newsTitlePattern: /^Latest notes$/ },
    ];

    for (const check of checks) {
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(check.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(450);
      await expect(page.locator('.home-hero')).toBeVisible();
      await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
      await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);
      await expect(page.locator('.home-music-feature')).toBeVisible();
      await expect(page.locator('.home-shows')).toBeVisible();
      await expect(page.locator('.home-news')).toBeVisible();
      await expect(page.locator('.home-gallery')).toBeVisible();
      await expect(page.locator('.home-next')).toBeVisible();
      await expect(page.locator('.home-news-card')).toHaveCount(3);
      await expect(page.locator('.home-next-link')).toHaveCount(5);

      const homeShowCount = await page.locator('.home-show').count();
      expect(homeShowCount).toBeLessThanOrEqual(3);
      expect(homeShowCount).toBeGreaterThan(0);

      await page.setViewportSize({ width: 430, height: 932 });
      await page.waitForTimeout(450);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator('.home-hero')).toBeVisible();
      await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
      await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);

      const mobileLayout = await page.evaluate(() => {
        const overflowing = Array.from(document.querySelectorAll(
          '.home-hero-actions, .home-hero-link, .home-section-cta, .home-text-link, .home-next-link'
        ))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: element.className || element.tagName,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            };
          })
          .filter((rect) => rect.left < -1 || rect.right > window.innerWidth + 1 || rect.width > window.innerWidth + 1);

        const hero = document.querySelector('.home-hero')?.getBoundingClientRect();
        const intro = document.querySelector('.home-intro')?.getBoundingClientRect();

        return {
          overflowing,
          introHintVisible: !!hero && !!intro && hero.bottom <= window.innerHeight && intro.top < window.innerHeight,
        };
      });

      expect(mobileLayout.overflowing).toEqual([]);
      expect(mobileLayout.introHintVisible).toBeTruthy();

      await page.setViewportSize({ width: 1366, height: 900 });
      await page.waitForTimeout(450);
      await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
      await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);
    }
  });
});
