const { test, expect } = require('@playwright/test');

test('mobile landing avoids dynamic viewport geometry and full-section backdrop filters', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/home-landing-page/);
  const filters = await page.locator('.home-landing > section').evaluateAll(elements => elements.map(el => getComputedStyle(el).backdropFilter));
  expect(filters.every(filter => filter === 'none')).toBe(true);
  await expect(page.locator('#patronite')).toHaveCSS('isolation', 'isolate');
  expect(await page.locator('#patronite').evaluate(el => getComputedStyle(el, '::after').filter)).toContain('blur');
  const heroHeightRule = await page.locator('.home-landing-hero').evaluate(el => {
    const matches = [];
    const visit = rules => Array.from(rules).forEach(rule => {
      if (rule.selectorText && el.matches(rule.selectorText) && rule.style.height) matches.push(rule.style.height);
      if (rule.cssRules) visit(rule.cssRules);
    });
    Array.from(document.styleSheets).filter(sheet => sheet.href?.includes('styles-home')).forEach(sheet => visit(sheet.cssRules));
    return matches;
  });
  expect(heroHeightRule).toContain('100svh');
  expect(heroHeightRule).not.toContain('100dvh');
  await context.close();
});

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

test('mobile landing stops at the footer and immediately scrolls back up', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.shop-footer-copy').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(page.locator('html')).toHaveCSS('overscroll-behavior-y', 'none');
  await expect(page.locator('body')).toHaveCSS('overscroll-behavior-y', 'none');
  const bottom = await page.evaluate(() => scrollY);
  await page.mouse.move(200, 700);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(bottom, 0);
  // Safari may report out-of-range scroll positions even when the document is at its end.
  await page.evaluate(bottom => {
    handleHeaderVisibility(bottom + 160);
    handleHeaderVisibility(bottom);
  }, bottom);
  await expect(page.locator('header.shop-header')).toHaveClass(/is-hidden/);
  await page.mouse.wheel(0, -250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(bottom - 100);
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await context.close();
});

test('touch scrolling responds to repeated direction changes on the landing', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const touch = await context.newCDPSession(page);
  for (const selector of ['.home-shows', '.home-news-v2', '.home-gallery']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    let y = 550;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y }] });
    for (const endY of [300, 520, 280, 500]) {
      const before = await page.evaluate(() => scrollY);
      const startY = y;
      for (let step = 1; step <= 8; step++) {
        y = startY + (endY - startY) * step / 8;
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
        await page.waitForTimeout(20);
      }
      await expect.poll(() => page.evaluate(() => scrollY)).not.toBe(before);
      const after = await page.evaluate(() => scrollY);
      expect(Math.sign(after - before)).toBe(Math.sign(startY - endY));
      expect(Math.abs(after - before)).toBeGreaterThan(80);
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.screenshot({ path: 'tmp/index-mobile-scroll-fixed.png' });
  await context.close();
});
