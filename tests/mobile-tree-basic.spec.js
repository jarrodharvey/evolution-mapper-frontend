const { test, expect } = require('@playwright/test');

test.describe('Mobile Tree View Basic Functionality', () => {
  test('should render basic tree structure on mobile', async ({ browser }) => {
    test.setTimeout(120000); // Increase timeout to 2 minutes for tree generation
    // Create mobile context to trigger mobile detection
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });

    const page = await context.newPage();

    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    // Generate a tree
    const randomButton = page.locator('button:has-text("Pick species for me")');
    await randomButton.waitFor({ state: 'visible' });
    await randomButton.click();

    // Wait for progress checklist to appear
    await page.waitForSelector('.progress-checklist', { timeout: 10000 });
    console.log('Progress checklist appeared');

    // Wait for progress to complete by watching for the disappearance of progress checklist
    await page.waitForFunction(() => {
      const progressChecklist = document.querySelector('.progress-checklist');
      return !progressChecklist || progressChecklist.style.display === 'none';
    }, { timeout: 120000 }); // 2 minutes max for backend processing
    console.log('Progress completed');

    // Wait a bit more for tree rendering after progress completes
    await page.waitForTimeout(2000);

    // Wait for floating controls to appear (tree view mode)
    await page.waitForSelector('.floating-mode', { timeout: 5000 });
    console.log('Floating mode activated');

    // Now wait for tree items to render
    await page.waitForFunction(() => {
      const treeItems = document.querySelectorAll('[role="treeitem"]');
      return treeItems.length > 0;
    }, { timeout: 10000 });
    console.log('Tree items rendered');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'mobile-tree-test.png', fullPage: true });

    // Check if MUI TreeView is rendered (should see tree items)
    const treeItems = page.locator('[role="treeitem"]');
    const treeItemCount = await treeItems.count();

    console.log(`Found ${treeItemCount} tree items`);
    expect(treeItemCount).toBeGreaterThan(0);

    await context.close();
  });
});