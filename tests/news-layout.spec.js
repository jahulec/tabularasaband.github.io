const { test, expect } = require('@playwright/test');

for (const path of ['/news.html', '/news-en.html']) {
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
