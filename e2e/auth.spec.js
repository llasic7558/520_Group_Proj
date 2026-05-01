import { expect, test } from '@playwright/test'
import { login, seededUser, uniqueFiveCollegeEmail } from './fixtures.js'

test('shows an inline error for invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(seededUser.email)
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Invalid email or password',
  )
})

test('signs in with a seeded user and reaches the opportunities feed', async ({
  page,
}) => {
  await login(page)

  await expect(
    page.getByRole('heading', {
      name: 'CS 187 Data Structures Tutor Needed',
    }),
  ).toBeVisible()
  await expect(
    page.locator('.fcc-detail__poster'),
  ).toBeVisible()
  await expect(page.locator('.fcc-detail__poster')).toContainText(
    'Sarah Johnson • UMass Amherst',
  )
})

test('blocks signup step 1 for non-five-colleges email addresses', async ({
  page,
}) => {
  await page.goto('/signup')
  await page.getByLabel('University email').fill('user@gmail.com')
  await page.getByLabel('Password').fill('StrongPass123')
  await page.getByRole('button', { name: /Next/i }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Use a umass.edu, amherst.edu, smith.edu, hampshire.edu, or mtholyoke.edu email.',
  )
})

test('completes signup and lands on verify email', async ({ page }) => {
  const email = uniqueFiveCollegeEmail()

  await page.goto('/signup')
  await page.getByLabel('University email').fill(email)
  await page.getByLabel('Password').fill('StrongPass123')
  await page.getByRole('button', { name: /Next/i }).click()

  await expect(page.getByText('Step 2 of 2')).toBeVisible()
  await page.getByLabel('Full name').fill('Playwright Student')
  await page.getByLabel('Major').fill('Computer Science')
  await page.getByLabel('Graduation year').fill('2027')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/verify-email$/)
  await expect(
    page.getByRole('heading', { name: 'Verify your email' }),
  ).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
})
