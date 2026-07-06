const { test, expect } = require('@playwright/test');

test.describe('UI/UX a11y regressions', () => {
  test('cookie consent is available at first render and persists the choice', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const banner = page.locator('#trCookieConsentBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('role', 'dialog');
    await expect(banner).toHaveAttribute('aria-label', /Ustawienia prywatności/);

    await banner.locator('[data-cookie-action="reject-optional"]').click();
    await expect(banner).toHaveAttribute('aria-hidden', 'true');
    await expect(banner).not.toHaveClass(/is-visible/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(banner).toHaveAttribute('aria-hidden', 'true');
    await expect(banner).not.toHaveClass(/is-visible/);
  });

  test('all embedded iframes have non-empty title', async ({ page }) => {
    test.setTimeout(60000);

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
    test.setTimeout(90000);

    const checks = [
      { path: '/index.html', newsTitlePattern: /^Co nowego$/ },
      { path: '/index-en.html', newsTitlePattern: /^From the band notebook$/ },
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
      await expect(page.locator('.home-news-v2')).toBeVisible();
      await expect(page.locator('.home-gallery')).toBeVisible();
      await expect(page.locator('.home-intro')).toHaveCount(0);
      await expect(page.locator('.home-news-v2-card')).toHaveCount(3);
      await expect(page.locator('.home-news-card')).toHaveCount(0);
      await expect(page.locator('#legacy-news')).toHaveCount(0);
      await expect(page.locator('.home-gallery-media img')).toHaveCount(5);

      const homeShowCount = await page.locator('.home-show').count();
      expect(homeShowCount).toBeLessThanOrEqual(5);
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
            '.home-release-cover',
            '.home-news-v2-grid',
            '.home-news-v2-card',
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
            '.home-section h1, .home-section h2, .home-show h3'
          ))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              const nearViewport = rect.bottom >= -1 && rect.top <= window.innerHeight + 1;
              if (!nearViewport) return false;
              const styles = window.getComputedStyle(element);
              return (
                rect.left < -1 ||
                rect.right > window.innerWidth + 1 ||
                (styles.overflowX === 'hidden' && element.scrollWidth > element.clientWidth + 1)
              );
            })
            .map((element) => element.textContent.trim());

          return {
            overflowing,
            documentOverflow,
            clippedHeadings,
            heroBottom: hero?.bottom ?? 0,
            musicTop: music?.top ?? 0,
            musicHintVisible: !!hero && !!music && hero.bottom <= window.innerHeight + 1 && music.top <= window.innerHeight + 1,
          };
        });

        expect(mobileLayout.overflowing).toEqual([]);
        expect(mobileLayout.documentOverflow).toBeFalsy();
        expect(mobileLayout.clippedHeadings).toEqual([]);
        expect(mobileLayout.musicHintVisible).toBeTruthy();

        const musicTop = await page.locator('.home-music-feature').evaluate((element) => element.offsetTop);
        await page.evaluate((target) => window.scrollTo(0, Math.max(0, target - window.innerHeight * 0.72)), musicTop);
        await page.waitForTimeout(450);
        const coverScaleEarly = await page.locator('.home-release-cover').evaluate((element) =>
          Number(getComputedStyle(element).getPropertyValue('--mobile-kinetic-scale').trim())
        );
        await page.evaluate((target) => window.scrollTo(0, target + 120), musicTop);
        await page.waitForTimeout(500);
        const coverScaleLate = await page.locator('.home-release-cover').evaluate((element) =>
          Number(getComputedStyle(element).getPropertyValue('--mobile-kinetic-scale').trim())
        );
        expect(coverScaleLate).toBeGreaterThanOrEqual(coverScaleEarly);

        const showsTop = await page.locator('.home-shows').evaluate((element) => element.offsetTop);
        await page.evaluate((target) => window.scrollTo(0, target + 24), showsTop);
        await page.waitForTimeout(350);
        const showsTrackStart = await page.locator('.home-shows-list').evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--home-shows-track-y').trim()
        );
        await page.evaluate((target) => window.scrollTo(0, target + 520), showsTop);
        await page.waitForTimeout(450);
        const showsTrackEnd = await page.locator('.home-shows-list').evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--home-shows-track-y').trim()
        );
        expect(showsTrackStart).not.toBe('');
        expect(showsTrackEnd).not.toBe(showsTrackStart);

        const newsTop = await page.locator('.home-news-v2').evaluate((element) => element.offsetTop);
        await page.evaluate((target) => window.scrollTo(0, target + 24), newsTop);
        await page.waitForTimeout(350);
        await expect(page.locator('.home-news-v2-card').first()).toBeVisible();
        const newsLayout = await page.locator('.home-news-v2-grid').evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            cardCount: element.querySelectorAll('.home-news-v2-card').length,
          };
        });
        expect(newsLayout.cardCount).toBe(3);
        expect(newsLayout.left).toBeGreaterThanOrEqual(-1);
        expect(newsLayout.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(newsLayout.width).toBeLessThanOrEqual(viewport.width + 1);

        const galleryTop = await page.locator('.home-gallery').evaluate((element) => element.offsetTop);
        await page.evaluate((target) => window.scrollTo(0, target + 40), galleryTop);
        await page.waitForTimeout(350);
        const galleryStart = await page.locator('.home-gallery-text').evaluate((element) => ({
          opacity: Number(getComputedStyle(element).opacity),
          mediaTop: element.parentElement?.parentElement
            ?.querySelector('.home-gallery-media')
            ?.getBoundingClientRect().top,
        }));
        await page.evaluate((target) => window.scrollTo(0, target + 520), galleryTop);
        await page.waitForTimeout(450);
        const galleryState = await page.locator('.home-gallery-media').evaluate((element) => {
          const styles = getComputedStyle(element);
          const text = element.parentElement?.querySelector('.home-gallery-text');
          const actions = element.parentElement?.querySelector('.home-inline-actions');
          return {
            columns: styles.gridTemplateColumns.split(' ').filter(Boolean).length,
            rows: styles.gridTemplateRows.split(' ').filter(Boolean).length,
            textOpacity: text ? Number(getComputedStyle(text).opacity) : 1,
            mediaTop: element.getBoundingClientRect().top,
            actionsTop: actions?.getBoundingClientRect().top,
            mediaBottom: element.getBoundingClientRect().bottom,
          };
        });
        expect(galleryState.columns).toBeGreaterThan(1);
        expect(galleryState.rows).toBeGreaterThan(1);
        expect(galleryState.textOpacity).toBeLessThan(galleryStart.opacity);
        expect(galleryState.mediaTop).toBeLessThan(galleryStart.mediaTop);
        expect(galleryState.actionsTop).toBeGreaterThan(galleryState.mediaBottom - 1);
      }

      await page.setViewportSize({ width: 1366, height: 900 });
      await page.waitForTimeout(450);
      await expect(page.locator('#homeHeroTitle')).toHaveText('Tabula Rasa');
      await expect(page.locator('#welcome')).toHaveText(check.newsTitlePattern);
    }
  });

  test('home landing motion respects reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(450);

    await expect(page.locator('body')).toHaveClass(/home-motion-static/);

    const reducedValues = await page.locator('.home-release-cover, .home-news-v2-card, .home-gallery-media picture')
      .evaluateAll((elements) => elements.map((element) => {
        const styles = getComputedStyle(element);
        return {
          transform: styles.transform,
          x: styles.getPropertyValue('--mobile-kinetic-x').trim(),
          y: styles.getPropertyValue('--mobile-kinetic-y').trim(),
          rotate: styles.getPropertyValue('--mobile-kinetic-rotate').trim(),
          scale: styles.getPropertyValue('--mobile-kinetic-scale').trim(),
        };
      }));

    expect(reducedValues.length).toBeGreaterThan(0);
    expect(reducedValues.every((value) => value.transform === 'none')).toBeTruthy();
    expect(reducedValues.every((value) => value.x === '0px')).toBeTruthy();
    expect(reducedValues.every((value) => value.y === '0px')).toBeTruthy();
    expect(reducedValues.every((value) => value.rotate === '0deg')).toBeTruthy();
    expect(reducedValues.every((value) => value.scale === '1')).toBeTruthy();
  });
});
