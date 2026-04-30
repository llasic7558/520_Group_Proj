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
})
