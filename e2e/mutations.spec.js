import { expect, test } from '@playwright/test'
import {
  createListingApi,
  login,
  seededApplicant,
  seededOwner,
  seededUser,
  uniqueListingTitle,
} from './fixtures.js'

test('creates a posting from the UI and finds it in the feed', async ({
  page,
}) => {
  const title = uniqueListingTitle('Playwright UI Posting')

  await login(page, seededUser)
  await page.getByRole('link', { name: 'Create Posting' }).click()

  await expect(page).toHaveURL(/\/postings\/new$/)
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Project' }).click()
  await page.getByLabel('Description').fill(
    'Posting created by Playwright to verify the create posting flow.',
  )
  await page.getByLabel('Add skill').fill('Playwright')
  await page.getByRole('button', { name: '+ Add skill' }).click()
  await page.getByRole('button', { name: 'Email' }).click()
  await page.getByLabel('Contact details').fill('emily.rodriguez@umass.edu')
  await page.getByRole('button', { name: 'Publish' }).click()

  await expect(page).toHaveURL(/\/opportunities$/)
  await page.getByPlaceholder('Search opportunities...').fill(title)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

test('submits an application for a newly created listing', async ({
  page,
  request,
}) => {
  const { title } = await createListingApi(request, seededOwner, {
    title: uniqueListingTitle('Playwright Application Target'),
    description:
      'Listing created by Playwright so another seeded user can apply through the UI.',
  })

  await login(page, seededApplicant)
  await page.getByPlaceholder('Search opportunities...').fill(title)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('button', { name: 'Apply Now' }).click()
  await expect(
    page.getByRole('dialog', { name: title }),
  ).toBeVisible()
  await page
    .getByLabel('Message to the poster')
    .fill('Playwright applicant message for end-to-end coverage.')
  await page.getByRole('button', { name: 'Submit Application' }).click()

  await expect(
    page.getByRole('button', { name: 'Application Sent' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Application Sent' }),
  ).toBeDisabled()
})
