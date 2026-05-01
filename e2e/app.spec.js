import { expect, test } from '@playwright/test'
import { login, seededUser } from './fixtures.js'

test('filters the opportunities feed after login', async ({ page }) => {
  await login(page)

  await page.getByRole('tab', { name: 'Projects' }).click()

  await expect(
    page.getByText('React Developer for Sustainability App'),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'React Developer for Sustainability App' }),
  ).toBeVisible()
})

test('opens the signed-in user profile page', async ({ page }) => {
  await login(page)

  await page.getByRole('link', { name: 'My profile' }).click()

  await expect(page).toHaveURL(/\/profile$/)
  await expect(
    page.getByRole('heading', { name: seededUser.fullName }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Edit Profile' }),
  ).toBeVisible()
  await expect(page.getByText('Computer Science & Mathematics')).toBeVisible()
})
