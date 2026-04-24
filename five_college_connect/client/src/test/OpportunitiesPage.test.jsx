import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OpportunitiesPage from '../pages/OpportunitiesPage/OpportunitiesPage.jsx'
import { mockJsonResponse, renderWithProviders } from './test-utils.jsx'

const sampleListing = {
  listingId: 'listing-1',
  createdByUserId: 'user-1',
  title: 'Campus Planner App',
  description: 'Build a campus planner with React and Postgres.',
  category: 'project',
  contactMethod: 'profile',
  contactDetails: '',
  status: 'open',
  createdAt: '2026-04-20T12:00:00.000Z',
  updatedAt: '2026-04-20T12:00:00.000Z',
  skills: [
    {
      listingSkillId: 'skill-1',
      listingId: 'listing-1',
      skillId: 'skill-a',
      name: 'React',
      category: 'Frameworks',
      requirementType: 'required',
    },
  ],
  creator: {
    userId: 'user-1',
    emailVerified: true,
    teacherBadge: false,
    profile: {
      profileId: 'profile-1',
      userId: 'user-1',
      fullName: 'Alex Rivera',
      college: 'UMass Amherst',
      major: 'Computer Science',
      graduationYear: 2027,
      bio: '',
      interests: '',
      availability: '',
      lookingFor: '',
      profileImageUrl: '',
    },
  },
}

describe('OpportunitiesPage', () => {
  it('loads listings and shows the welcome banner when flagged', async () => {
    sessionStorage.setItem('fcc.welcomeBanner', '1')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => mockJsonResponse({ items: [sampleListing] })),
    )

    renderWithProviders(<OpportunitiesPage />)

    expect(
      await screen.findAllByText('Campus Planner App'),
    ).toHaveLength(2)
    expect(
      screen.getByText('Build a campus planner with React and Postgres.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Welcome! Add your bio, interests, and skills to your profile.'),
    ).toBeInTheDocument()
  })

  it('shows an error state when the listings request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network unavailable'))),
    )

    renderWithProviders(<OpportunitiesPage />)

    expect(
      await screen.findByText('Could not reach the server. Is it running?'),
    ).toBeInTheDocument()
  })
})
