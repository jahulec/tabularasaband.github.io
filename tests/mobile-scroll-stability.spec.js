const { test, expect } = require('@playwright/test');

test('small direction reversals do not repeatedly toggle the mobile header', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('header.shop-header');
  const scrollTo = async (top) => {
    await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top);
    await page.waitForTimeout(50);
  };
  await scrollTo(1000);
  await expect(header).toHaveClass(/is-hidden/);
  for (const position of [990, 995, 980]) {
    await scrollTo(position);
    await expect(header).toHaveClass(/is-hidden/);
  }
  await scrollTo(930);
  await expect(header).not.toHaveClass(/is-hidden/);
  for (const delta of [250, -180, 230, -150]) {
    const before = await page.evaluate(() => scrollY);
    await page.mouse.move(200, 600);
    await page.mouse.wheel(0, delta);
    await expect.poll(() => page.evaluate(() => scrollY)).not.toBe(before);
    const after = await page.evaluate(() => scrollY);
    expect(Math.sign(after - before)).toBe(Math.sign(delta));
  }
  await context.close();
});
