const { test, expect } = require('@playwright/test');

async function mockSpeciesSearch(page) {
  await page.route('**/api/species?**', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        species: [
          {
            common: 'Human',
            scientific: 'Homo sapiens',
            has_datelife: true
          }
        ]
      })
    });
  });
}

async function selectHumanSpecies(page) {
  const searchInput = page.locator('.species-select input');
  await searchInput.click();
  await searchInput.fill('human');
  await page.getByRole('option', { name: /Human \(Homo sapiens\)/ }).click();
  await expect(page.locator('.selection-info')).toContainText('Selected: 1 species');
}

async function mockMobileTreeGeneration(page) {
  await page.route('**/api/random-species?**', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        selected_species: {
          common_names: ['Human', 'Dog', 'Whale'],
          scientific_names: ['Homo sapiens', 'Canis lupus familiaris', 'Balaenoptera musculus'],
          has_datelife: [true, true, true]
        }
      })
    });
  });

  await page.route('**/api/get_progress_token', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, token: 'test-token' })
    });
  });

  await page.route('**/api/progress?**', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'completed',
        steps: [{ step: 'request_completed', status: 'completed', timestamp: new Date().toISOString() }]
      })
    });
  });

  await page.route('**/api/full-tree-dated', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        legend_type: 'no_dates',
        missing_common_names: [],
        dropped_common_names: [],
        tree_json: {
          node_label: 'Common ancestor',
          node_type: 'ancestor',
          color: '#999999',
          has_age: false,
          age_info: 'age unavailable',
          node_shape: 'circle',
          children: [
            {
              node_label: 'Human',
              node_type: 'species',
              color: '#4CAF50',
              has_age: false,
              age_info: 'present',
              node_shape: 'circle',
              children: []
            },
            {
              node_label: 'Dog and whale ancestor',
              node_type: 'ancestor',
              color: '#3498db',
              has_age: true,
              age_info: '95 Ma',
              node_shape: 'circle',
              info_panel: {
                geologic_age: 'Cretaceous',
                wikipedia_text: 'A mocked ancestor used for mobile dark mode testing.'
              },
              children: [
                {
                  node_label: 'Dog',
                  node_type: 'species',
                  color: '#4CAF50',
                  has_age: false,
                  age_info: 'present',
                  node_shape: 'circle',
                  children: []
                },
                {
                  node_label: 'Whale',
                  node_type: 'species',
                  color: '#4CAF50',
                  has_age: false,
                  age_info: 'present',
                  node_shape: 'circle',
                  children: []
                }
              ]
            }
          ]
        }
      })
    });
  });

  await page.route('**/api/legend?**', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        type: 'no_dates',
        legend: {
          species: {
            node_type: 'species',
            label: 'Species',
            color: '#4CAF50',
            color_name: 'Green',
            description: 'Selected species',
            shape: 'circle'
          },
          ancestor: {
            node_type: 'ancestor',
            label: 'Ancestor',
            color: '#999999',
            color_name: 'Grey',
            description: 'Common ancestor',
            shape: 'circle'
          }
        }
      })
    });
  });
}

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

  test('should render mobile tree on narrow viewport without mobile user agent', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: false
    });

    const page = await context.newPage();
    await mockMobileTreeGeneration(page);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    await page.getByRole('button', { name: 'Pick species for me' }).click();
    await page.waitForSelector('.floating-toolbar', { timeout: 10000 });
    await expect(page.locator('[role="treeitem"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('treeitem', { name: /Common ancestor/ })).toBeVisible();

    await context.close();
  });

  test('should show and persist mobile dark mode toggle', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      colorScheme: 'light'
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    const toggle = page.getByRole('switch');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    const backgroundBefore = await page.locator('.App').evaluate(el => getComputedStyle(el).backgroundColor);
    await toggle.click();
    await expect(page.locator('.App')).toHaveClass(/mobile-dark-mode/);
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    const backgroundAfter = await page.locator('.App').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(backgroundAfter).not.toBe(backgroundBefore);

    await page.reload();
    await page.waitForSelector('.evolution-mapper-container');
    await expect(page.locator('.App')).toHaveClass(/mobile-dark-mode/);
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    await context.close();
  });

  test('should follow mobile OS dark preference before manual selection', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      colorScheme: 'dark'
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    await expect(page.locator('.App')).toHaveClass(/mobile-dark-mode/);
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    await context.close();
  });

  test('should keep mobile dark mode toggle hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    await expect(page.getByRole('switch')).toBeHidden();
  });

  test('should apply mobile dark mode to progress overlay', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      hasTouch: true,
      colorScheme: 'light'
    });

    const page = await context.newPage();
    await mockMobileTreeGeneration(page);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    await page.getByRole('switch').click();
    await expect(page.locator('.App')).toHaveClass(/mobile-dark-mode/);

    await page.getByRole('button', { name: 'Pick species for me' }).click();
    const overlay = page.locator('.progress-overlay');
    await expect(overlay).toHaveClass(/mobile-dark-progress/);

    const overlayBackground = await overlay.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(overlayBackground).toContain('16, 24, 32');

    await context.close();
  });

  test('should keep mobile dark mode toggle available in floating tree view', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });

    const page = await context.newPage();
    await mockMobileTreeGeneration(page);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    await page.getByRole('button', { name: 'Pick species for me' }).click();
    await page.waitForSelector('.floating-toolbar', { timeout: 10000 });

    const toolbarToggle = page.locator('.floating-toolbar').getByRole('switch');
    await expect(toolbarToggle).toBeVisible();
    await toolbarToggle.click();
    await expect(page.locator('.App')).toHaveClass(/mobile-dark-mode/);
    await expect(page.locator('.tree-legend')).toHaveClass(/mobile-dark-legend/);

    await context.close();
  });

  test('should hide initial random species button on mobile after species selection', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });

    const page = await context.newPage();
    await mockSpeciesSearch(page);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    const randomButton = page.getByRole('button', { name: 'Pick species for me' });
    await expect(randomButton).toBeVisible();

    await selectHumanSpecies(page);

    await expect(randomButton).toBeHidden();
    await expect(page.getByRole('button', { name: 'Show me how they evolved!' })).toBeVisible();

    await context.close();
  });

  test('should keep initial random species button visible on desktop after species selection', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mockSpeciesSearch(page);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.evolution-mapper-container');

    const randomButton = page.getByRole('button', { name: 'Pick species for me' });
    await expect(randomButton).toBeVisible();

    await selectHumanSpecies(page);

    await expect(randomButton).toBeVisible();
  });
});
