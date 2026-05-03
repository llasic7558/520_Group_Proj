import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProfilePreviewModal from '../components/ProfilePreviewModal.jsx'
import { renderWithProviders } from './test-utils.jsx'

describe('ProfilePreviewModal', () => {
  it('renders profile details, skills, courses, and closes from the action', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    renderWithProviders(
      <ProfilePreviewModal
        closeLabel="Choose student"
        onClose={onClose}
        profile={{
          fullName: 'Maya Chen',
          college: 'Smith College',
          graduationYear: 2026,
          major: 'Data Science',
          bio: 'I like building useful campus tools.',
          lookingFor: 'Research and project teams',
          skills: [
            {
              userSkillId: 'skill-1',
              name: 'Python',
              proficiencyLevel: 'advanced',
            },
          ],
          courses: [
            {
              userCourseId: 'course-1',
              courseCode: 'CSC 212',
              courseName: 'Data Structures',
            },
          ],
        }}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Maya Chen' })

    expect(within(dialog).getByText('Smith College • Class of 2026')).toBeInTheDocument()
    expect(within(dialog).getByText('Data Science')).toBeInTheDocument()
    expect(
      within(dialog).getByText('I like building useful campus tools.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Research and project teams')).toBeInTheDocument()
    expect(within(dialog).getByText('Python • advanced')).toBeInTheDocument()
    expect(within(dialog).getByText('CSC 212')).toBeInTheDocument()
    expect(within(dialog).getByText('Data Structures')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose student' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders fallback copy for sparse profile data', () => {
    renderWithProviders(
      <ProfilePreviewModal
        onClose={vi.fn()}
        profile={{
          full_name: 'Sparse Student',
          looking_for: '',
          skills: [],
          courses: [],
        }}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Sparse Student' })

    expect(within(dialog).getByText('Student profile')).toBeInTheDocument()
    expect(within(dialog).getByText('No bio added yet.')).toBeInTheDocument()
    expect(within(dialog).getByText('No preference added yet.')).toBeInTheDocument()
    expect(within(dialog).getByText('No skills added yet.')).toBeInTheDocument()
    expect(within(dialog).getByText('No courses added yet.')).toBeInTheDocument()
  })

  it('renders nothing without a profile', () => {
    const { container } = renderWithProviders(
      <ProfilePreviewModal onClose={vi.fn()} profile={null} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
