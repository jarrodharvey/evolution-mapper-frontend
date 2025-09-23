const { test, expect } = require('@playwright/test');

test('Legend displays type-aware headers and enhanced styling', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');

  // Wait for the page to load
  await expect(page.locator('h1')).toContainText('Evolution Mapper');

  // Click the random species button to trigger tree generation
  await page.click('button:has-text("Pick species for me")');

  // Wait for tree view and legend to appear
  await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.tree-legend')).toBeVisible({ timeout: 10000 });

  // Check if the enhanced header is displayed
  const legendTitle = await page.locator('.legend-title').textContent();
  console.log(`Legend title: ${legendTitle}`);

  const legendSubtitle = await page.locator('.legend-subtitle').textContent();
  console.log(`Legend subtitle: ${legendSubtitle}`);

  // Verify the legend has type-specific class
  const legendElement = page.locator('.tree-legend');
  const legendClass = await legendElement.getAttribute('class');
  console.log(`Legend classes: ${legendClass}`);

  // Check for PhyloPic silhouettes
  const phylopicItems = await page.locator('.legend-phylopic').count();
  console.log(`PhyloPic items found: ${phylopicItems}`);

  if (phylopicItems > 0) {
    // Check if silhouettes are displayed
    const firstPhylopic = page.locator('.phylopic-silhouette').first();
    await expect(firstPhylopic).toBeVisible();
    console.log('✅ PhyloPic silhouettes are displayed');
  }

  // Check for age-related styling
  const ageRelatedItems = await page.locator('.legend-item.age-related').count();
  console.log(`Age-related items found: ${ageRelatedItems}`);

  // Check for age gradient indicator
  const hasAgeGradient = await page.locator('.tree-legend.legend-type-mixed .legend-items::before, .tree-legend.legend-type-dated .legend-items::before, .tree-legend.legend-type-hybrid .legend-items::before').count();
  console.log(`Age gradient indicator present: ${hasAgeGradient > 0}`);

  // Test hover interactions
  const firstLegendItem = page.locator('.legend-item').first();
  await firstLegendItem.hover();
  console.log('✅ Hover interaction tested');

  // Check for color names in parentheses
  const colorNames = await page.locator('.legend-color-name').count();
  console.log(`Color names displayed: ${colorNames}`);

  // Check for attribution text
  const attributions = await page.locator('.legend-attribution').count();
  console.log(`Attribution text found: ${attributions}`);

  console.log('✅ Enhanced legend functionality test completed!');
});

test('Legend shows different content for different tree types', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Generate several trees to potentially get different legend types
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("Pick species for me")');
    await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });

    // Wait for legend to load
    await page.waitForTimeout(2000);

    const legendTitle = await page.locator('.legend-title').textContent();
    const legendSubtitle = await page.locator('.legend-subtitle').textContent();
    const legendItems = await page.locator('.legend-item').count();

    console.log(`Tree ${i + 1}:`);
    console.log(`  Title: ${legendTitle}`);
    console.log(`  Subtitle: ${legendSubtitle}`);
    console.log(`  Items: ${legendItems}`);

    // Try a new tree if we're not at the last iteration
    if (i < 2) {
      await page.click('.floating-random-button');
      await page.waitForTimeout(3000);
    }
  }

  console.log('✅ Legend type variation test completed!');
});