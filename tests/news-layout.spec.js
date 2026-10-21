const { test, expect } = require('@playwright/test');

for (const path of ['/news.html', '/news-en.html']) {
  test(`article scrolls only its text and restores the list: ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 650 });
      await page.goto(path);
      const trigger = page.locator('[data-news-open="diamenty"]');
      await trigger.scrollIntoViewIfNeeded();
      const listTop = await page.locator('#news').evaluate(el => el.getBoundingClientRect().top);
      await trigger.click();
      const close = page.locator('[data-news-close]');
      await expect(close).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('position', 'fixed');
      const story = page.locator('[data-news-article="diamenty"]');
      const photo = story.locator('.news-reader-media');
      const copy = story.locator('.news-reader-copy');
      const beforePhoto = await photo.boundingBox();
      const beforeBackground = await page.locator('#news').evaluate(el => el.getBoundingClientRect().top);
      await photo.hover();
      await page.mouse.wheel(0, 700);
      await copy.hover();
      await page.mouse.wheel(0, 700);
      await expect.poll(() => copy.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      const afterPhoto = await photo.boundingBox();
      expect(Math.abs(afterPhoto.y - beforePhoto.y)).toBeLessThan(1);
      expect(await page.locator('#news').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(beforeBackground, 0);
      await close.click();
      await expect(page.locator('[data-news-reader]')).toBeHidden();
      await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
      expect(await page.locator('#news').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(listTop, 0);
    }
  });

  test(`article layout keeps the photo and text apart: ${path}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const slug of ['grand-prix', 'przebudzenie-tour-podsumowanie', 'diamenty']) {
        await page.goto(path + '#' + slug, { waitUntil: 'domcontentloaded' });
        const story = page.locator(`[data-news-article="${slug}"]`);
        await expect(story).toBeVisible();
        await expect(page.locator('[data-news-close]')).toBeFocused();
        const layout = await story.evaluate(el => {
          const box = node => node.getBoundingClientRect().toJSON();
          const reader = el.closest('[data-news-reader]');
          return {
            photo: box(el.querySelector('.news-reader-media')),
            copy: box(el.querySelector('.news-reader-copy')),
            title: box(el.querySelector('h2')),
            toolbar: box(reader.querySelector('.news-reader-toolbar')),
            contentWidth: reader.scrollWidth,
            readerWidth: reader.clientWidth,
          };
        });
        expect(layout.contentWidth).toBeLessThanOrEqual(layout.readerWidth + 1);
        expect(layout.title.left).toBeGreaterThanOrEqual(0);
        expect(layout.title.right).toBeLessThanOrEqual(width);
        expect(layout.photo.top).toBeGreaterThanOrEqual(layout.toolbar.bottom - 1);
        if (width <= 900) expect(layout.copy.top).toBeGreaterThanOrEqual(layout.photo.bottom - 1);
        else expect(layout.copy.left).toBeGreaterThanOrEqual(layout.photo.right - 1);
      }
    }
  });

  test(`news cards keep text below photos and preserve the reader: ${path}`, async ({ page }) => {
    await page.goto(path);
    const cards = page.locator('.news-hub-card');
    await expect(cards).toHaveCount(9);
    await expect(page.locator('.news-hub-excerpt')).toHaveCount(0);
    await expect(cards.locator('small')).toHaveCount(0);
    const dates = await cards.locator('time').evaluateAll(elements => elements.map(el => el.dateTime));
    expect(dates).toEqual([...dates].sort().reverse());
    for (const width of [1440, 820, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await cards.evaluateAll(elements => elements.map(el => {
        const photo = el.querySelector('picture').getBoundingClientRect();
        const copy = el.querySelector('.home-news-v2-copy').getBoundingClientRect();
        return { width: el.getBoundingClientRect().width, cardBottom: el.getBoundingClientRect().bottom, photoBottom: photo.bottom, copyTop: copy.top, copyBottom: copy.bottom };
      }));
      expect(layout.every(card => card.copyTop >= card.photoBottom - 1)).toBe(true);
      expect(layout.every(card => card.copyBottom <= card.cardBottom + 1)).toBe(true);
      expect(Math.max(...layout.map(card => card.width)) - Math.min(...layout.map(card => card.width))).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await page.locator('[data-news-open="diamenty"]').click();
    const reader = page.locator('[data-news-reader]');
    await expect(reader).toBeVisible();
    await expect(page.locator('[data-news-article="diamenty"]')).toBeVisible();
    await expect(page.locator('[data-news-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(reader).toBeHidden();
    await page.goto(path + '#grand-prix');
    await expect(page.locator('[data-news-article="grand-prix"]')).toBeVisible();
    await expect(page.locator('[data-news-article="grand-prix"] time')).toHaveText('2026');
  });
}
