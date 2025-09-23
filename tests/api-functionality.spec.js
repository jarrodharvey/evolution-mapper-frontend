const { test, expect } = require('@playwright/test');

test.describe('API Functionality', () => {
  test('should successfully load random species without NetworkError', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    // Try clicking the "Pick species for me" button to test random species API
    const randomButton = page.locator('button:has-text("Pick species for me")');
    await randomButton.waitFor({ state: 'visible' });
    await randomButton.click();

    // Wait for the API call to complete
    await page.waitForTimeout(3000);

    // Check if species were loaded (should see selected species)
    const selectionInfo = page.locator('.selection-info p').first();
    const selectedText = await selectionInfo.textContent();

    // Should show some number of species selected
    expect(selectedText).toMatch(/Selected: \d+ species/);

    // Check for any error messages - should be none
    const errorElement = page.locator('.error-message');
    const errorCount = await errorElement.count();
    expect(errorCount).toBe(0);
  });

  test('should handle species search without NetworkError', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    // Try searching for a species
    const searchInput = page.locator('.species-select input');
    await searchInput.fill('human');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Should not have any error messages
    const errorElement = page.locator('.error-message');
    const errorCount = await errorElement.count();
    expect(errorCount).toBe(0);
  });
});