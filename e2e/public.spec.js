import { expect, test } from '@playwright/test'

test('landing page exposes the main entry points', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: /Across Five Colleges/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Log in' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Sign up' }),
  ).toBeVisible()
})

test('protected routes redirect unauthenticated users to login', async ({
  page,
}) => {
  await page.goto('/profile')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
})
