import { Route, Routes } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CreatePostingPage from '../pages/CreatePostingPage/CreatePostingPage.jsx'
import { mockJsonResponse, renderWithProviders } from './test-utils.jsx'

describe('CreatePostingPage', () => {
  it('shows a validation error when publishing without a title', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderWithProviders(<CreatePostingPage />)

    await user.click(screen.getByRole('button', { name: 'Publish' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A title is required before publishing.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits the listing payload and navigates after publishing', async () => {
    const user = userEvent.setup()
    let savedPayload = null

    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init) => {
        savedPayload = JSON.parse(init.body)
        return mockJsonResponse({
          listing: {
            listingId: 'listing-1',
            title: savedPayload.title,
          },
        })
      }),
    )

    renderWithProviders(
      <Routes>
        <Route path="/postings/new" element={<CreatePostingPage />} />
        <Route
          path="/opportunities"
          element={<div>Published destination</div>}
        />
      </Routes>,
      {
        route: '/postings/new',
      },
    )

    await user.type(screen.getByLabelText('Title'), 'Build a planner')
    await user.click(screen.getByRole('button', { name: 'Project' }))
    await user.type(
      screen.getByLabelText('Description'),
      'Create a project planning app for the Five Colleges.',
    )
    await user.type(screen.getByLabelText('Add skill'), 'React')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() =>
      expect(savedPayload).toMatchObject({
        title: 'Build a planner',
        description: 'Create a project planning app for the Five Colleges.',
        category: 'project',
        contact_method: 'profile',
        status: 'open',
        skills: [
          {
            name: 'React',
            category: 'General',
            requirementType: 'required',
          },
        ],
      }),
    )

    expect(
      await screen.findByText('Published destination'),
    ).toBeInTheDocument()
  })

  it('loads an existing listing and submits updates without attachments', async () => {
    const user = userEvent.setup()
    let updatedPayload = null

    vi.stubGlobal(
      'fetch',
      vi.fn((url, init = {}) => {
        const href = String(url)

        if (
          href.includes('/api/listings/listing-1') &&
          (!init.method || init.method === 'GET')
        ) {
          return mockJsonResponse({
            listing: {
              listingId: 'listing-1',
              title: 'Original title',
              description: 'Original description',
              category: 'project',
              contactMethod: 'email',
              contactDetails: 'owner@umass.edu',
              bannerImageUrl: 'https://example.com/banner.jpg',
              customColor: '#123456',
              status: 'open',
              expirationDate: '2026-12-31T00:00:00.000Z',
              skills: [{ name: 'React' }],
            },
          })
        }

        if (
          href.includes('/api/listings/listing-1') &&
          init.method === 'PUT'
        ) {
          updatedPayload = JSON.parse(init.body)
          return mockJsonResponse({
            listing: {
              listingId: 'listing-1',
              title: updatedPayload.title,
            },
          })
        }

        return mockJsonResponse({}, { status: 404 })
      }),
    )

    renderWithProviders(
      <Routes>
        <Route path="/postings/:listingId/edit" element={<CreatePostingPage />} />
        <Route path="/profile" element={<div>Profile destination</div>} />
      </Routes>,
      {
        route: '/postings/listing-1/edit',
      },
    )

    expect(await screen.findByDisplayValue('Original title')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Updated title')
    await user.clear(screen.getByLabelText('Description'))
    await user.type(screen.getByLabelText('Description'), 'Updated description')
    await user.click(screen.getByRole('button', { name: 'Job' }))
    await user.type(screen.getByLabelText('Add skill'), 'Node.js')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() =>
      expect(updatedPayload).toMatchObject({
        title: 'Updated title',
        description: 'Updated description',
        category: 'job',
        contact_method: 'email',
        contact_details: 'owner@umass.edu',
        banner_image_url: 'https://example.com/banner.jpg',
        custom_color: '#123456',
        status: 'open',
        expiration_date: '2026-12-31',
        attachments: [],
        skills: [
          {
            name: 'React',
            category: 'General',
            requirementType: 'required',
          },
          {
            name: 'Node.js',
            category: 'General',
            requirementType: 'required',
          },
        ],
      }),
    )

    expect(await screen.findByText('Profile destination')).toBeInTheDocument()
  })

  it('does not allow direct editing of a closed listing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        mockJsonResponse({
          listing: {
            listingId: 'listing-closed',
            title: 'Closed listing',
            description: 'This listing is closed.',
            category: 'project',
            contactMethod: 'profile',
            contactDetails: '',
            status: 'closed',
            skills: [],
          },
        }),
      ),
    )

    renderWithProviders(
      <Routes>
        <Route path="/postings/:listingId/edit" element={<CreatePostingPage />} />
      </Routes>,
      {
        route: '/postings/listing-closed/edit',
      },
    )

    expect(await screen.findByDisplayValue('Closed listing')).toBeInTheDocument()
    expect(
      screen.getByText('Closed listings cannot be edited. Reopen the listing first.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
  })
})
