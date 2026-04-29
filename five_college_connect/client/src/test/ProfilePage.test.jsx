import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProfilePage from '../pages/ProfilePage/ProfilePage.jsx'
import {
  createAuthValue,
  mockJsonResponse,
  renderWithProviders,
} from './test-utils.jsx'

function buildProfileResponse({ skills = [], courses = [] } = {}) {
  return {
    profileId: 'profile-1',
    userId: 'user-1',
    fullName: 'Alex Rivera',
    bio: 'Builder and collaborator.',
    college: 'UMass Amherst',
    major: 'Computer Science',
    graduationYear: 2027,
    interests: 'AI, Design',
    availability: 'Weekends',
    lookingFor: 'Projects',
    profileImageUrl: '',
    skills,
    courses,
  }
}

describe('ProfilePage', () => {
  it('renders project postings and recent activity from user-scoped API data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        const href = String(url)

        if (href.includes('/api/profiles/user-1')) {
          return mockJsonResponse({
            profile: buildProfileResponse(),
          })
        }

        if (href.includes('/api/listings?createdByUserId=user-1&limit=10')) {
          return mockJsonResponse({
            items: [
              {
                listingId: 'project-1',
                title: 'Project Showcase',
                description: 'A real project posting.',
                category: 'project',
                createdAt: '2026-04-23T12:00:00.000Z',
                skills: [{ name: 'React' }],
              },
              {
                listingId: 'tutoring-1',
                title: 'Algorithms Tutor',
                description: 'Help with problem sets.',
                category: 'tutoring',
                createdAt: '2026-04-22T12:00:00.000Z',
                skills: [],
              },
            ],
          })
        }

        if (href.includes('/api/applications?limit=10')) {
          return mockJsonResponse({
            items: [
              {
                applicationId: 'application-1',
                listingId: 'listing-99',
                applicantUserId: 'user-1',
                status: 'pending',
                message: 'Interested',
                submittedAt: '2026-04-24T12:00:00.000Z',
              },
            ],
          })
        }

        if (href.includes('/api/listings/listing-99')) {
          return mockJsonResponse({
            listing: {
              listingId: 'listing-99',
              title: 'Research Assistant',
            },
          })
        }

        throw new Error(`Unhandled fetch URL: ${href}`)
      }),
    )

    renderWithProviders(<ProfilePage />, {
      authValue: createAuthValue({
        user: {
          id: 'user-1',
          email: 'alex@umass.edu',
          emailVerified: true,
        },
        isAuthenticated: true,
      }),
    })

    const featuredProjectsHeading = await screen.findByRole('heading', {
      name: 'Featured Projects',
    })
    const featuredProjectsSection = featuredProjectsHeading.closest('section')

    expect(featuredProjectsSection).not.toBeNull()
    expect(
      within(featuredProjectsSection).getByText('Project Showcase'),
    ).toBeInTheDocument()
    expect(
      within(featuredProjectsSection).getByText('A real project posting.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Applied to Research Assistant')).toBeInTheDocument()
    expect(
      screen.getByText('Created a project posting: Project Showcase'),
    ).toBeInTheDocument()
  })

  it('lets the user add a skill and course, then saves them to the profile API', async () => {
    const user = userEvent.setup()
    let savedPayload = null

    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) => {
        const href = String(url)

        if (href.includes('/api/profiles/user-1') && (!init || init.method === 'GET')) {
          return mockJsonResponse({
            profile: buildProfileResponse(),
          })
        }

        if (href.includes('/api/listings?createdByUserId=user-1&limit=10')) {
          return mockJsonResponse({ items: [] })
        }

        if (href.includes('/api/applications?limit=10')) {
          return mockJsonResponse({ items: [] })
        }

        if (href.includes('/api/profiles/user-1') && init?.method === 'PUT') {
          savedPayload = JSON.parse(init.body)
          return mockJsonResponse({
            profile: buildProfileResponse({
              skills: [
                {
                  userSkillId: 'skill-1',
                  userId: 'user-1',
                  profileId: 'profile-1',
                  skillId: 'skill-a',
                  name: 'TypeScript',
                  category: 'Languages',
                  proficiencyLevel: 'advanced',
                  isOfferingHelp: true,
                  isSeekingHelp: false,
                },
              ],
              courses: [
                {
                  userCourseId: 'course-1',
                  userId: 'user-1',
                  profileId: 'profile-1',
                  courseId: 'course-a',
                  courseCode: 'COMPSCI 520',
                  courseName: 'Software Engineering',
                  institution: 'UMass Amherst',
                  status: 'completed',
                  grade: 'A',
                },
              ],
            }),
          })
        }

        throw new Error(`Unhandled fetch URL: ${href}`)
      }),
    )

    renderWithProviders(<ProfilePage />, {
      authValue: createAuthValue({
        user: {
          id: 'user-1',
          email: 'alex@umass.edu',
          emailVerified: true,
        },
        isAuthenticated: true,
      }),
    })

    expect(await screen.findByText('Builder and collaborator.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }))
    await user.click(screen.getByRole('button', { name: '+ Add Skill' }))
    await user.click(screen.getByRole('button', { name: '+ Add Course' }))

    const skillEditors = screen.getAllByLabelText('Skill')
    await user.type(skillEditors[0], 'TypeScript')
    await user.clear(screen.getByLabelText('Category'))
    await user.type(screen.getByLabelText('Category'), 'Languages')
    await user.selectOptions(screen.getByLabelText('Level'), 'advanced')
    await user.click(screen.getByLabelText('I can help others with this'))

    await user.type(screen.getByLabelText('Course code'), 'COMPSCI 520')
    await user.type(screen.getByLabelText('Course name'), 'Software Engineering')
    await user.type(screen.getByLabelText('Institution'), 'UMass Amherst')
    await user.type(screen.getByLabelText('Grade'), 'A')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(savedPayload).toMatchObject({
        skills: [
          {
            name: 'TypeScript',
            category: 'Languages',
            proficiencyLevel: 'advanced',
            isOfferingHelp: true,
            isSeekingHelp: false,
          },
        ],
        courses: [
          {
            courseCode: 'COMPSCI 520',
            courseName: 'Software Engineering',
            institution: 'UMass Amherst',
            status: 'completed',
            grade: 'A',
          },
        ],
      }),
    )

    expect(await screen.findByText('TypeScript')).toBeInTheDocument()

    const courseCard = screen.getByText(/COMPSCI 520 Software Engineering/)
    expect(within(courseCard.closest('.prof-course-card')).getByText('A')).toBeInTheDocument()
  })
})
