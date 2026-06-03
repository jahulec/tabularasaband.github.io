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
      { path: '/index.html', newsTitlePattern: /^Co nowego$/, newsCardCount: 8 },
      { path: '/index-en.html', newsTitlePattern: /^Latest notes$/, newsCardCount: 9 },
    ];
    const mobileViewports = [
      { width: 390, height: 844 },
      { width: 430, height: 932 },
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
      await expect(page.locator('.home-intro')).toHaveCount(0);
      await expect(page.locator('.home-news-card')).toHaveCount(check.newsCardCount);
      await expect(page.locator('.home-gallery-media img')).toHaveCount(4);

      const homeShowCount = await page.locator('.home-show').count();
      expect(homeShowCount).toBeLessThanOrEqual(3);
      expect(homeShowCount).toBeGreaterThan(0);

      for (const viewport of mobileViewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(450);
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(page.locator('.home-hero')).toBeVisible();
        await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
        await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);

        const mobileLayout = await page.evaluate(() => {
          const measuredSelectors = [
            '.home-hero-actions',
            '.home-hero-link',
            '.home-section',
            '.home-section-cta',
            '.home-text-link',
            '.home-video-frame',
            '.home-news-card',
            '.home-gallery-media',
          ];
          const overflowing = Array.from(document.querySelectorAll(measuredSelectors.join(',')))
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
          const music = document.querySelector('.home-music-feature')?.getBoundingClientRect();
          const documentOverflow =
            document.documentElement.scrollWidth > window.innerWidth + 1 ||
            document.body.scrollWidth > window.innerWidth + 1;
          const clippedHeadings = Array.from(document.querySelectorAll(
            '.home-section h1, .home-section h2, .home-show h3, .home-news-card h3'
          ))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const styles = window.getComputedStyle(element);
              return (
                rect.left < -1 ||
                rect.right > window.innerWidth + 1 ||
                (styles.overflowX === 'hidden' && element.scrollWidth > element.clientWidth + 1)
              );
            })
            .map((element) => element.textContent.trim());
          const visibleNewsExtras = Array.from(document.querySelectorAll('.home-news-extra'))
            .filter((element) => window.getComputedStyle(element).display !== 'none')
            .length;

          return {
            overflowing,
            documentOverflow,
            clippedHeadings,
            visibleNewsExtras,
            heroBottom: hero?.bottom ?? 0,
            musicTop: music?.top ?? 0,
            musicHintVisible: !!hero && !!music && hero.bottom <= window.innerHeight && music.top < window.innerHeight,
          };
        });

        expect(mobileLayout.overflowing).toEqual([]);
        expect(mobileLayout.documentOverflow).toBeFalsy();
        expect(mobileLayout.clippedHeadings).toEqual([]);
        expect(mobileLayout.visibleNewsExtras).toBeLessThanOrEqual(1);
        expect(mobileLayout.musicHintVisible).toBeTruthy();
      }

      await page.setViewportSize({ width: 1366, height: 900 });
      await page.waitForTimeout(450);
      await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
      await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);
    }
  });
});
