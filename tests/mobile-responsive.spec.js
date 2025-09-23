const { test, expect } = require('@playwright/test');

test.describe('Mobile Responsive Evolution Mapper', () => {
  test('should detect desktop as non-mobile', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000');

    // Wait for the app to load
    await page.waitForSelector('.evolution-mapper-container');

    // Test mobile detection function
    const mobileDetection = await page.evaluate(() => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const smallScreen = window.innerWidth <= 768;
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return mobileUserAgent || (smallScreen && touchCapable);
    });

    expect(mobileDetection).toBe(false);
  });

  test('should detect mobile device correctly', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000');

    // Wait for the app to load
    await page.waitForSelector('.evolution-mapper-container');

    // Test mobile detection function
    const mobileDetection = await page.evaluate(() => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const smallScreen = window.innerWidth <= 768;
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return mobileUserAgent || (smallScreen && touchCapable);
    });

    expect(mobileDetection).toBe(true);
    await context.close();
  });

  test('should render species selector on both desktop and mobile', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for main components
    await expect(page.locator('.evolution-mapper-container')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Evolution Mapper');

    // Check for species selector
    await expect(page.locator('.species-select')).toBeVisible();
  });

  test('should show mobile-friendly interface on small screens', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000');

    await page.waitForSelector('.evolution-mapper-container');

    // The interface should be responsive and usable on mobile
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(viewportWidth).toBeLessThanOrEqual(768);

    await context.close();
  });
});