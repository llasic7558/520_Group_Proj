import { expect } from '@playwright/test'

export const seededUser = {
  email: 'emily.rodriguez@umass.edu',
  password: 'DemoPass123!',
  fullName: 'Emily Rodriguez',
}

export async function login(page, user = seededUser) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/\/opportunities$/)
  await expect(
    page.getByRole('heading', { name: 'Opportunities' }),
  ).toBeVisible()
}

export function uniqueFiveCollegeEmail() {
  return `playwright.${Date.now()}@umass.edu`
}
