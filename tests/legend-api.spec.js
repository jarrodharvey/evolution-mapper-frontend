const { test, expect } = require('@playwright/test');

test('Legend API integration with legend_type parameter', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');

  // Wait for the page to load
  await expect(page.locator('h1')).toContainText('Evolution Mapper');

  // Set up network monitoring to capture API calls
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });

  const apiResponses = [];
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiResponses.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  // Click the random species button to trigger tree generation
  await page.click('button:has-text("Pick species for me")');

  // Wait for tree view to appear
  await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });

  // Wait for legend to appear
  await expect(page.locator('.tree-legend')).toBeVisible({ timeout: 10000 });

  // Check if /api/full-tree-dated was called
  const fullTreeRequest = apiRequests.find(req => req.url.includes('/api/full-tree-dated'));
  expect(fullTreeRequest).toBeTruthy();
  console.log('✅ /api/full-tree-dated request found');

  // Check if /api/legend was called
  const legendRequests = apiRequests.filter(req => req.url.includes('/api/legend'));
  expect(legendRequests.length).toBeGreaterThan(0);
  console.log(`✅ Found ${legendRequests.length} /api/legend request(s)`);

  // Check if the legend request includes the type parameter
  const legendRequestWithType = legendRequests.find(req => req.url.includes('type='));
  if (legendRequestWithType) {
    console.log(`✅ Legend request with type parameter: ${legendRequestWithType.url}`);
  } else {
    console.log('❌ No legend request found with type parameter');
    console.log('Legend requests:', legendRequests.map(req => req.url));
  }

  // Check if legend content is displayed properly
  const legendItems = await page.locator('.legend-item');
  const legendCount = await legendItems.count();
  console.log(`Legend items found: ${legendCount}`);

  if (legendCount > 0) {
    // Check if legend items have proper structure
    const firstItem = legendItems.first();
    await expect(firstItem.locator('.legend-color')).toBeVisible();
    await expect(firstItem.locator('.legend-label')).toBeVisible();
    console.log('✅ Legend items have proper structure');
  } else {
    console.log('❌ No legend items found');
  }

  console.log('All API requests made:');
  apiRequests.forEach(req => {
    console.log(`  ${req.method} ${req.url}`);
  });
});

test('Legend API response structure validation', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');

  // Set up response monitoring to capture API response data
  const apiResponseData = {};
  page.on('response', async response => {
    if (response.url().includes('/api/full-tree-dated')) {
      try {
        const data = await response.json();
        apiResponseData.fullTreeData = data;
        console.log('Full tree response structure:', Object.keys(data));
        if (data.legend_type) {
          console.log('✅ legend_type found in response:', data.legend_type);
        } else {
          console.log('❌ legend_type not found in full-tree-dated response');
        }
      } catch (error) {
        console.log('Error parsing full-tree-dated response:', error.message);
      }
    }

    if (response.url().includes('/api/legend')) {
      try {
        const data = await response.json();
        apiResponseData.legendData = data;
        console.log('Legend response structure:', Object.keys(data));
        if (data.legend) {
          console.log('Legend data type:', Array.isArray(data.legend) ? 'array' : typeof data.legend);
          if (Array.isArray(data.legend) && data.legend.length > 0) {
            console.log('First legend item structure:', Object.keys(data.legend[0]));
          }
        }
      } catch (error) {
        console.log('Error parsing legend response:', error.message);
      }
    }
  });

  // Trigger tree generation
  await page.click('button:has-text("Pick species for me")');
  await expect(page.locator('.floating-toolbar')).toBeVisible({ timeout: 30000 });

  // Wait a bit for all API calls to complete
  await page.waitForTimeout(2000);

  console.log('Response data analysis complete');
});