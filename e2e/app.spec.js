import { expect, test } from '@playwright/test'
import {
  createListingApi,
  login,
  seededOwner,
  seededUser,
  uniqueListingTitle,
} from './fixtures.js'

test('filters the opportunities feed after login', async ({ page, request }) => {
  const { title } = await createListingApi(request, seededOwner, {
    title: uniqueListingTitle('Playwright Project Filter Target'),
    category: 'project',
  })

  await login(page)

  await page.getByRole('tab', { name: 'Projects' }).click()
  await page.getByPlaceholder('Search opportunities...').fill(title)

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
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
