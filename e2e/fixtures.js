import { expect } from '@playwright/test'

export const apiBaseUrl = 'http://127.0.0.1:4000'

export const seededUser = {
  email: 'emily.rodriguez@umass.edu',
  password: 'DemoPass123!',
  fullName: 'Emily Rodriguez',
}

export const seededOwner = {
  email: 'sarah.johnson@umass.edu',
  password: 'DemoPass123!',
  fullName: 'Sarah Johnson',
}

export const seededApplicant = {
  email: 'michael.chen@umass.edu',
  password: 'DemoPass123!',
  fullName: 'Michael Chen',
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

export function uniqueListingTitle(prefix = 'Playwright Listing') {
  return `${prefix} ${Date.now()}`
}

export async function signInApi(request, user) {
  const response = await request.post(`${apiBaseUrl}/api/auth/signin`, {
    data: {
      email: user.email,
      password: user.password,
    },
  })

  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  expect(payload.authToken).toBeTruthy()

  return payload.authToken
}

export async function createListingApi(request, user, overrides = {}) {
  const authToken = await signInApi(request, user)
  const title = overrides.title ?? uniqueListingTitle()
  const response = await request.post(`${apiBaseUrl}/api/listings`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    data: {
      title,
      description:
        overrides.description ??
        'Created by Playwright to support repeatable end-to-end coverage.',
      category: overrides.category ?? 'project',
      contact_method: overrides.contact_method ?? 'email',
      contact_details: overrides.contact_details ?? user.email,
      custom_color: overrides.custom_color ?? '#124734',
      status: overrides.status ?? 'open',
      skills: overrides.skills ?? [
        {
          name: 'Playwright',
          category: 'Testing',
          requirementType: 'required',
        },
      ],
      attachments: overrides.attachments ?? [],
    },
  })

  expect(response.ok()).toBeTruthy()
  const payload = await response.json()

  return {
    title,
    listing: payload.listing,
  }
}
