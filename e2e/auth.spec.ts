import { test, expect } from '@playwright/test'

test('auth page loads and login fails with wrong password', async ({ page }) => {
  await page.goto('/auth')
  await expect(page.getByText('Streamline Your Real Estate Deals')).toBeVisible()
  await page.fill('input[name="username"]', 'admin')
  await page.fill('input[name="password"]', 'wrongpass')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid username or password')).toBeVisible({ timeout: 10000 })
})