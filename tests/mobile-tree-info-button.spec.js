const { test, expect } = require('@playwright/test');

const MOBILE_CONTEXT_OPTIONS = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  viewport: { width: 390, height: 844 },
  hasTouch: true,
};

async function generateTree(page) {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.evolution-mapper-container');

  const randomButton = page.getByRole('button', { name: /pick species for me/i });
  await randomButton.waitFor({ state: 'visible' });
  await randomButton.click();

  // Wait for checklist to appear and eventually disappear
  await page.waitForSelector('.progress-checklist', { timeout: 10000 }).catch(() => {});
  await page.waitForFunction(() => {
    const checklist = document.querySelector('.progress-checklist');
    return !checklist || checklist.style.display === 'none';
  }, { timeout: 120000 });

  // Give the tree a moment to render after progress completes
  await page.waitForTimeout(2000);

  await page.waitForFunction(() => document.querySelectorAll('[role="treeitem"]').length > 0, {
    timeout: 15000,
  });
}

test.describe('Mobile tree info disclosure', () => {
  test('expand icon and label do not open info panel while info button does', async ({ browser }) => {
    test.setTimeout(180000);

    const context = await browser.newContext(MOBILE_CONTEXT_OPTIONS);
    const page = await context.newPage();

    await generateTree(page);

    const firstTreeItem = page.locator('[role="treeitem"]').first();
    await expect(firstTreeItem).toBeVisible();

    const dialog = page.getByRole('dialog');

    // Clicking the expand/collapse icon should not open the info panel
    const iconContainer = firstTreeItem.locator('.MuiTreeItem-iconContainer').first();
    if (await iconContainer.count()) {
      await iconContainer.click();
      await expect(dialog).toHaveCount(0);
    }

    // Clicking the label text should not open the info panel either
    const label = firstTreeItem.locator('.MuiTreeItem-label').first();
    if (await label.count()) {
      const boundingBox = await label.boundingBox();
      if (boundingBox) {
        await label.click({ position: { x: Math.min(20, boundingBox.width / 2), y: Math.min(10, boundingBox.height / 2) } });
      } else {
        await label.click();
      }
      await expect(dialog).toHaveCount(0);
    }

    // The dedicated info button should open the info panel
    const infoButton = page.locator('button[aria-label^="View info for"]');
    await infoButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await infoButton.first().click();

    await expect(dialog).toBeVisible();

    await dialog.locator('button:has-text("Close")').click();
    await expect(dialog).toHaveCount(0);

    await context.close();
  });
});
