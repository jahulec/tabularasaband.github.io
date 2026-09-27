const { test, expect } = require('@playwright/test');

test('mobile menu keeps keyboard focus inside and restores it on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/press.html', { waitUntil: 'domcontentloaded' });
  const menu = page.locator('#nav-mobile');
  const toggle = page.locator('#hamburger');
  const links = menu.locator('a');
  await expect(menu).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('inert', '');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
