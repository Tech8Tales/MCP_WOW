const { test, expect } = require('@playwright/test');

test.describe('Maharashtra GST Website Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://www.mahagst.gov.in/');
    });

    test('should load homepage successfully', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('Maharashtra GST');
    });

    test('should have header and footer', async ({ page }) => {
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('footer')).toBeVisible();
    });

    test('should have working navigation menu', async ({ page }) => {
        const navMenu = page.locator('nav');
        await expect(navMenu).toBeVisible();
    });

    test('should have login functionality', async ({ page }) => {
        const loginButton = page.getByRole('link', { name: /login/i });
        await expect(loginButton).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
        const searchBox = page.getByPlaceholder(/search/i);
        await expect(searchBox).toBeVisible();
    });

    test('should be responsive', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        const mobileMenu = page.locator('[class*="mobile-menu"], [class*="hamburger"]');
        await expect(mobileMenu).toBeVisible();

        // Test desktop viewport
        await page.setViewportSize({ width: 1280, height: 800 });
        const desktopNav = page.locator('nav');
        await expect(desktopNav).toBeVisible();
    });

    test('should load images properly', async ({ page }) => {
        const images = page.locator('img');
        const count = await images.count();
        expect(count).toBeGreaterThan(0);

        // Check if images have alt text
        for (let i = 0; i < count; i++) {
            const image = images.nth(i);
            await expect(image).toHaveAttribute('alt');
        }
    });

    test('should have proper accessibility attributes', async ({ page }) => {
        // Check for ARIA labels in interactive elements
        const buttons = page.locator('button, [role="button"]');
        const count = await buttons.count();
        
        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const hasAriaLabel = await button.evaluate(el => 
                el.hasAttribute('aria-label') || 
                el.hasAttribute('aria-labelledby') || 
                el.textContent.trim().length > 0
            );
            expect(hasAriaLabel).toBeTruthy();
        }
    });

    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('https://www.mahagst.gov.in/');
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    });

    test('should handle 404 pages gracefully', async ({ page }) => {
        await page.goto('https://www.mahagst.gov.in/nonexistent-page');
        await expect(page.locator('text=/404|not found|page not found/i')).toBeVisible();
    });
});