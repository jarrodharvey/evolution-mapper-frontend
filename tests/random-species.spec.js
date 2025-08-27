const { test, expect } = require('@playwright/test');

test('Random species functionality works with new API endpoint', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await expect(page.locator('h1')).toContainText('Evolution Mapper');
  
  // Click the random species button
  await page.click('button:has-text("Pick species for me")');
  
  // Wait for tree view to appear (indicates success)
  await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });
  
  // Check that the tree iframe is present
  await expect(page.locator('.tree-iframe')).toBeVisible();
  
  // Check that species were selected in the floating toolbar
  const speciesTokens = await page.locator('.floating-species-picker .css-1fdsijx-ValueContainer2 .css-qbdosj-Input').count();
  console.log(`Selected species in floating toolbar: ${speciesTokens}`);
  
  // Verify we have 3-7 species (as per the random count range)
  const speciesInfo = await page.locator('.floating-species-info').textContent();
  console.log(`Species info: ${speciesInfo}`);
  
  // Check that species info shows selected count
  await expect(page.locator('.floating-species-info')).toContainText(/Selected: [3-7] species/);
  
  console.log('✅ Random species functionality test passed!');
});

test('Random species button works in floating toolbar', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // First, get into tree view by clicking random species
  await page.click('button:has-text("Pick species for me")');
  await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });
  
  // Now test the floating random button
  await page.click('.floating-random-button');
  
  // Wait for loading to complete
  await expect(page.locator('.floating-random-button')).not.toHaveText(/Loading/, { timeout: 30000 });
  
  // Check that the tree is still visible
  await expect(page.locator('.tree-iframe')).toBeVisible();
  
  console.log('✅ Floating toolbar random species functionality test passed!');
});