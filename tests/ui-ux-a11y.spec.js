const { test, expect } = require('@playwright/test');

test.describe('UI/UX a11y regressions', () => {
  test('Android-style vertical gestures stay native across content pages', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.localStorage.setItem('tr_cookie_consent_v1', JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
      }));
    });
    const page = await context.newPage();

    for (const path of [
      '/index.html',
      '/about.html',
      '/shows.html',
      '/music.html',
      '/news.html',
      '/press.html',
      '/shop.html',
      '/contact.html',
      '/gallery.html',
    ]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const state = await page.evaluate(() => {
        const target = document.elementFromPoint(320, 620) || document.body;
        const dispatchTouch = (type, x, y) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(event, 'touches', {
            value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
          });
          Object.defineProperty(event, 'changedTouches', {
            value: [{ clientX: x, clientY: y }],
          });
          return target.dispatchEvent(event);
        };

        dispatchTouch('touchstart', 320, 700);
        const moveAccepted = dispatchTouch('touchmove', 260, 660);
        dispatchTouch('touchend', 260, 660);

        const htmlStyle = getComputedStyle(document.documentElement);
        const bodyStyle = getComputedStyle(document.body);
        return {
          moveAccepted,
          menuOpen: document.body.classList.contains('menu-open'),
          htmlLocked: document.documentElement.classList.contains('scroll-locked'),
          bodyLocked: document.body.classList.contains('scroll-locked'),
          htmlOverflowY: htmlStyle.overflowY,
          bodyTouchAction: bodyStyle.touchAction,
          canScroll: document.documentElement.scrollHeight > window.innerHeight + 16,
        };
      });

      expect(state.moveAccepted, `${path} canceled a vertical gesture`).toBe(true);
      expect(state.menuOpen, `${path} opened the menu during a vertical gesture`).toBe(false);
      expect(state.htmlLocked, `${path} left html scroll-locked`).toBe(false);
      expect(state.bodyLocked, `${path} left body scroll-locked`).toBe(false);
      expect(state.htmlOverflowY, `${path} hides root overflow`).not.toBe('hidden');
      expect(state.bodyTouchAction, `${path} does not allow vertical panning`).toContain('pan-y');

      if (state.canScroll) {
        await page.evaluate(() => window.scrollTo(0, Math.min(600, document.documentElement.scrollHeight)));
        expect(await page.evaluate(() => window.scrollY), `${path} cannot change scroll position`).toBeGreaterThan(0);
      }
    }

    await context.close();
  });

  test('landing sections overlap their translucent boundaries without one-pixel seams', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

      const boundaries = await page.locator('.home-landing > section').evaluateAll((sections) => (
        sections.slice(1).map((section, index) => {
          const previous = sections[index].getBoundingClientRect();
          const current = section.getBoundingClientRect();
          return current.top - previous.bottom;
        })
      ));

      expect(boundaries.every((gap) => gap <= -0.9)).toBe(true);
      await expect(page.locator('.home-music-feature')).toHaveCSS('border-top-width', '0px');
    }
  });

  test('calendar tiles belong to the shows page and keep a transparent background', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-show-date')).toHaveCount(0);
    await expect(page.locator('.home-show time').first()).toContainText(/\d{1,2} \S+ 2026/);

    await page.goto('/shows.html', { waitUntil: 'domcontentloaded' });
    const dates = page.locator('.concert-date');
    await expect(dates.first()).toBeAttached();

    const layout = await page.locator('.concert-item').evaluateAll((items) => items.slice(0, 4).map((item) => {
      const date = item.querySelector('.concert-date');
      const title = item.querySelector('h3');
      const dateStyle = getComputedStyle(date);
      return {
        dateLeft: Math.round(date.getBoundingClientRect().left * 10) / 10,
        titleLeft: Math.round(title.getBoundingClientRect().left * 10) / 10,
        background: dateStyle.backgroundColor,
        weekdayColor: getComputedStyle(date.querySelector('.concert-date-weekday')).color,
      };
    }));

    expect(layout.every(({ dateLeft, titleLeft }) => dateLeft < titleLeft)).toBe(true);
    expect(Math.max(...layout.map(({ dateLeft }) => dateLeft)) - Math.min(...layout.map(({ dateLeft }) => dateLeft))).toBeLessThanOrEqual(1);
    expect(layout.every(({ background }) => background === 'rgba(0, 0, 0, 0)')).toBe(true);
    expect(layout.every(({ weekdayColor }) => weekdayColor === 'rgb(244, 0, 47)')).toBe(true);
  });

  test('news page title is centered on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/news.html', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#welcome')).toHaveCSS('text-align', 'center');
  });

  test('mobile background keeps a stable crop while browser chrome changes the visual viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/home-motion-static/);

    const readBackground = () => page.locator('.background-slider').evaluate((slider) => {
      const image = slider.querySelector('img.active') || slider.querySelector('img');
      const rect = slider.getBoundingClientRect();
      return {
        height: Math.round(rect.height),
        cssHeight: getComputedStyle(document.documentElement)
          .getPropertyValue('--tr-mobile-slider-height').trim(),
        imageTransform: image ? getComputedStyle(image).transform : '',
        imageAnimation: image ? getComputedStyle(image).animationName : '',
        imageTransition: image ? getComputedStyle(image).transitionProperty : '',
        footerBorder: getComputedStyle(document.querySelector('footer.shop-footer')).borderTopWidth,
        footerDivider: getComputedStyle(document.querySelector('footer.shop-footer'), '::before').content,
        footerVisibility: getComputedStyle(document.querySelector('footer.shop-footer')).contentVisibility,
        footerFilter: getComputedStyle(document.querySelector('footer.shop-footer')).backdropFilter,
      };
    });

    const before = await readBackground();
    await page.setViewportSize({ width: 390, height: 720 });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
      window.scrollTo(0, 600);
    });
    await page.waitForTimeout(250);
    const after = await readBackground();

    expect(before.cssHeight).toBe('844px');
    expect(after.cssHeight).toBe(before.cssHeight);
    expect(after.height).toBe(before.height);
    expect(after.imageTransform).toBe('none');
    expect(after.imageAnimation).toBe('none');
    expect(after.imageTransition).toContain('opacity');
    expect(after.footerBorder).toBe('0px');
    expect(after.footerDivider).toBe('none');
    expect(after.footerVisibility).toBe('visible');
    expect(after.footerFilter).toBe('none');

    await page.locator('.home-shows').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await expect(page.locator('.home-shows')).toHaveClass(/home-shows-animated/);
    await expect(page.locator('.home-shows .home-show').first()).toHaveCSS('animation-name', 'tr-home-show-enter');
    await context.close();
  });

  test('decorative slider never exposes filenames or broken-image fallback text', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const readSlides = () => page.locator('.background-slider img').evaluateAll((images) => images.map((image) => ({
      alt: image.getAttribute('alt'),
      ariaHidden: image.getAttribute('aria-hidden'),
      draggable: image.getAttribute('draggable'),
      hasSource: Boolean(image.getAttribute('src')),
    })));

    for (const slide of await readSlides()) {
      expect(slide).toEqual({ alt: '', ariaHidden: 'true', draggable: 'false', hasSource: true });
    }

    await page.evaluate(() => changeSlide());
    await page.waitForTimeout(1200);

    for (const slide of await readSlides()) {
      expect(slide).toEqual({ alt: '', ariaHidden: 'true', draggable: 'false', hasSource: true });
    }
  });

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

        const backgroundStart = await page.locator('.background-slider').evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const img = element.querySelector('img.active') || element.querySelector('img');
          return {
            width: rect.width,
            height: rect.height,
            transform: img ? getComputedStyle(img).transform : '',
            animationName: img ? getComputedStyle(img).animationName : '',
          };
        });
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45));
        await page.waitForTimeout(250);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        const backgroundEnd = await page.locator('.background-slider').evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const img = element.querySelector('img.active') || element.querySelector('img');
          return {
            width: rect.width,
            height: rect.height,
            transform: img ? getComputedStyle(img).transform : '',
            animationName: img ? getComputedStyle(img).animationName : '',
          };
        });
        expect(backgroundEnd.width).toBeCloseTo(backgroundStart.width, 0);
        expect(backgroundEnd.height).toBeCloseTo(backgroundStart.height, 0);
        expect(backgroundEnd.transform).toBe('none');
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
        expect(Number.parseFloat(showsTrackStart)).toBe(0);
        expect(Number.parseFloat(showsTrackEnd)).toBe(0);

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
        await expect(page.locator('.home-news-v2-copy').first()).toHaveCSS('text-align', 'center');

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
        expect(galleryState.textOpacity).toBe(1);
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

  test('home video uses a lightweight facade and creates the player on demand', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const video = page.locator('.home-release-video');
    const facade = video.locator('.youtube-facade');

    await expect(facade).toBeVisible();
    await expect(video.locator('iframe')).toHaveCount(0);
    await facade.click();
    await expect(video.locator('iframe')).toHaveCount(1);
    await expect(video.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/DQwpv5y-qAU/);
    await expect(video.locator('iframe')).toHaveAttribute('title', /Diamenty/);
  });
});
