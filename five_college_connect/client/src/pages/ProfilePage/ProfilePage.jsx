import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.js'
import {
  closeListing,
  fetchApplications,
  fetchListing,
  fetchListings,
  fetchProfile,
  permanentlyDeleteListing,
  reopenListing,
  updateProfile,
} from '../../lib/api.js'
import { TopNav } from '../../components/opportunities/TopNav.jsx'
import {
  IconGithub,
  IconMail,
  IconPin,
  IconShare,
  IconUserDoc,
  IconVerified,
} from '../../components/opportunities/Icons.jsx'
import { logError, logInfo, logWarn } from '../../lib/logger.js'
import '../OpportunitiesPage/OpportunitiesPage.css'
import './ProfilePage.css'

const PROFICIENCY_OPTIONS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]

const COURSE_STATUS_OPTIONS = [
  'completed',
  'in-progress',
  'planned',
  'dropped',
]

const EMPTY_PROFILE = {
  profile_id: null,
  user_id: null,
  full_name: '',
  bio: '',
  college: '',
  major: '',
  graduation_year: '',
  interests: '',
  availability: '',
  looking_for: '',
  profile_image_url: '',
  skills: [],
  courses: [],
}

function createDraftSkill() {
  return {
    user_skill_id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    skill_name: '',
    category: 'General',
    proficiency_level: 'intermediate',
    is_offering_help: false,
    is_seeking_help: false,
  }
}

function createDraftCourse() {
  return {
    user_course_id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    course_code: '',
    course_name: '',
    institution: '',
    status: 'completed',
    grade: '',
  }
}

function normalizeProfile(profile) {
  return {
    profile_id: profile?.profileId ?? null,
    user_id: profile?.userId ?? null,
    full_name: profile?.fullName ?? '',
    bio: profile?.bio ?? '',
    college: profile?.college ?? '',
    major: profile?.major ?? '',
    graduation_year: profile?.graduationYear ?? '',
    interests: profile?.interests ?? '',
    availability: profile?.availability ?? '',
    looking_for: profile?.lookingFor ?? '',
    profile_image_url: profile?.profileImageUrl ?? '',
    skills: Array.isArray(profile?.skills)
      ? profile.skills.map((skill) => ({
          user_skill_id:
            skill.userSkillId ??
            `skill-${Math.random().toString(36).slice(2, 8)}`,
          user_id: skill.userId,
          profile_id: skill.profileId,
          skill_id: skill.skillId,
          skill_name: skill.name,
          category: skill.category,
          proficiency_level: skill.proficiencyLevel,
          is_offering_help: skill.isOfferingHelp,
          is_seeking_help: skill.isSeekingHelp,
        }))
      : [],
    courses: Array.isArray(profile?.courses)
      ? profile.courses.map((course) => ({
          user_course_id:
            course.userCourseId ??
            `course-${Math.random().toString(36).slice(2, 8)}`,
          user_id: course.userId,
          profile_id: course.profileId,
          course_id: course.courseId,
          course_code: course.courseCode,
          course_name: course.courseName,
          institution: course.institution,
          status: course.status,
          grade: course.grade,
        }))
      : [],
  }
}

function buildProfilePayload(profile) {
  return {
    fullName: profile.full_name.trim(),
    bio: profile.bio.trim(),
    college: profile.college.trim(),
    major: profile.major.trim(),
    graduationYear:
      profile.graduation_year === '' ? null : Number(profile.graduation_year),
    interests: profile.interests.trim(),
    availability: profile.availability.trim(),
    lookingFor: profile.looking_for.trim(),
    profileImageUrl: profile.profile_image_url.trim(),
    skills: (profile.skills ?? [])
      .map((skill) => ({
        name: skill.skill_name.trim(),
        category: (skill.category || 'General').trim(),
        proficiencyLevel: (
          skill.proficiency_level || 'intermediate'
        ).trim(),
        isOfferingHelp: Boolean(skill.is_offering_help),
        isSeekingHelp: Boolean(skill.is_seeking_help),
      }))
      .filter((skill) => skill.name),
    courses: (profile.courses ?? [])
      .map((course) => ({
        courseCode: course.course_code.trim(),
        courseName: course.course_name.trim(),
        institution: course.institution.trim(),
        status: course.status.trim(),
        grade: course.grade.trim(),
      }))
      .filter((course) => course.courseCode),
  }
}

function skillIconClass(name) {
  const n = name.toLowerCase()
  if (
    n.includes('java') ||
    n.includes('script') ||
    n.includes('python') ||
    n.includes('react') ||
    n.includes('node')
  ) {
    return 'prof-skill-card__icon prof-skill-card__icon--code'
  }
  return 'prof-skill-card__icon'
}

function normalizeProjectListings(items) {
  if (!Array.isArray(items)) return []

  return items.map((listing) => ({
    project_id: listing.listingId,
    title: listing.title || 'Untitled project',
    description: listing.description || 'No description provided.',
    tags: Array.isArray(listing.skills)
      ? listing.skills
          .map((skill) => skill.name)
          .filter(Boolean)
          .slice(0, 4)
      : [],
  }))
}

function normalizeOwnedListings(items) {
  if (!Array.isArray(items)) return []

  return items.map((listing) => ({
    listingId: listing.listingId,
    title: listing.title || 'Untitled listing',
    description: listing.description || 'No description provided.',
    category: String(listing.category || 'opportunity').toLowerCase(),
    status: String(listing.status || 'open').toLowerCase(),
    createdAt: listing.createdAt,
  }))
}

function normalizeAppliedApplications(items, listingsById) {
  if (!Array.isArray(items)) return []

  return items.map((application) => {
    const listing = listingsById.get(application.listingId)

    return {
      applicationId: application.applicationId,
      listingId: application.listingId,
      title: listing?.title || 'Listing unavailable',
      category: String(listing?.category || 'opportunity').toLowerCase(),
      listingStatus: String(listing?.status || '').toLowerCase(),
      applicationStatus: String(application.status || 'pending').toLowerCase(),
      message: application.message || '',
      submittedAt: application.submittedAt,
    }
  })
}

function formatRelativeTime(iso) {
  if (!iso) return 'Recently'

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

function buildRecentActivity({ listings, applications, listingTitles }) {
  const listingActivity = (listings ?? []).map((listing) => {
    const category = String(listing.category || 'opportunity').toLowerCase()
    const label =
      category === 'study_group'
        ? 'study group'
        : category || 'opportunity'

    return {
      id: `listing-${listing.listingId}`,
      message: `Created a ${label} posting: ${listing.title}`,
      occurredAt: listing.createdAt,
      occurred_at_label: formatRelativeTime(listing.createdAt),
    }
  })

  const applicationActivity = (applications ?? []).map((application) => {
    const listingTitle =
      listingTitles.get(application.listingId) || 'a listing'

    return {
      id: `application-${application.applicationId}`,
      message: `Applied to ${listingTitle}`,
      occurredAt: application.submittedAt,
      occurred_at_label: formatRelativeTime(application.submittedAt),
    }
  })

  return [...listingActivity, ...applicationActivity]
    .filter((item) => item.occurredAt)
    .sort((left, right) => {
      return new Date(right.occurredAt) - new Date(left.occurredAt)
    })
    .slice(0, 6)
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [ownedListings, setOwnedListings] = useState([])
  const [appliedApplications, setAppliedApplications] = useState([])
  const [projectListings, setProjectListings] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [listingActionError, setListingActionError] = useState('')
  const [closingListingId, setClosingListingId] = useState(null)
  const [reopeningListingId, setReopeningListingId] = useState(null)
  const [listingToClose, setListingToClose] = useState(null)
  const [openListingMenuId, setOpenListingMenuId] = useState(null)
  const [listingToDelete, setListingToDelete] = useState(null)
  const [deletingListingId, setDeletingListingId] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      if (!user?.id) {
        if (!ignore) {
          setProfile({ ...EMPTY_PROFILE })
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const [profileResult, listingsResult, applicationsResult] =
          await Promise.allSettled([
          fetchProfile(user.id),
          fetchListings({
            createdByUserId: user.id,
            limit: 10,
          }),
          fetchApplications({
            limit: 10,
          }),
        ])

        if (ignore) return

        if (profileResult.status === 'fulfilled') {
          setProfile(normalizeProfile(profileResult.value))
          logInfo('Profile loaded', {
            userId: user.id,
          })
        } else {
          setProfile({ ...EMPTY_PROFILE, user_id: user.id })
          logError('Profile failed to load', {
            userId: user.id,
            error:
              profileResult.reason instanceof Error
                ? profileResult.reason.message
                : String(profileResult.reason),
          })
          setErrorMessage(
            profileResult.reason?.message || 'Could not load your profile.',
          )
        }

        const ownedListings =
          listingsResult.status === 'fulfilled' ? listingsResult.value : []
        const ownApplications =
          applicationsResult.status === 'fulfilled'
            ? applicationsResult.value
            : []

        setOwnedListings(normalizeOwnedListings(ownedListings))
        setProjectListings(
          normalizeProjectListings(
            ownedListings.filter(
              (listing) =>
                String(listing.category || '').toLowerCase() === 'project',
            ),
          ),
        )

        const listingTitles = new Map()
        const listingsById = new Map()
        const applicationListingIds = [
          ...new Set(
            ownApplications
              .map((application) => application.listingId)
              .filter(Boolean),
          ),
        ]

        if (applicationListingIds.length > 0) {
          const listingLookups = await Promise.allSettled(
            applicationListingIds.map((listingId) => fetchListing(listingId)),
          )

          listingLookups.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              listingsById.set(applicationListingIds[index], result.value)
              if (result.value.title) {
                listingTitles.set(applicationListingIds[index], result.value.title)
              }
            }
          })
        }

        setAppliedApplications(
          normalizeAppliedApplications(ownApplications, listingsById),
        )
        setRecentActivity(
          buildRecentActivity({
            listings: ownedListings,
            applications: ownApplications,
            listingTitles,
          }),
        )
        logInfo('Profile related activity loaded', {
          userId: user.id,
          listingCount: ownedListings.length,
          applicationCount: ownApplications.length,
        })

        if (listingsResult.status !== 'fulfilled') {
          setOwnedListings([])
          setProjectListings([])
        }

        if (applicationsResult.status !== 'fulfilled') {
          setAppliedApplications([])
        }

        if (
          profileResult.status === 'fulfilled' &&
          listingsResult.status !== 'fulfilled'
        ) {
          logWarn('Profile listings failed to load', {
            userId: user.id,
            error:
              listingsResult.reason instanceof Error
                ? listingsResult.reason.message
                : String(listingsResult.reason),
          })
          setErrorMessage(
            listingsResult.reason?.message ||
              'Could not load your listings.',
          )
        }

        if (
          profileResult.status === 'fulfilled' &&
          listingsResult.status === 'fulfilled' &&
          applicationsResult.status !== 'fulfilled'
        ) {
          logWarn('Profile applications failed to load', {
            userId: user.id,
            error:
              applicationsResult.reason instanceof Error
                ? applicationsResult.reason.message
                : String(applicationsResult.reason),
          })
          setErrorMessage(
            applicationsResult.reason?.message ||
              'Could not load your recent activity.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [user?.id])

  function startEdit() {
    if (!profile) return
    setDraft({
      ...profile,
      skills: profile.skills.map((skill) => ({ ...skill })),
      courses: profile.courses.map((course) => ({ ...course })),
    })
    setErrorMessage('')
    setIsEditing(true)
  }

  async function confirmCloseListing() {
    if (!listingToClose?.listingId) return

    setClosingListingId(listingToClose.listingId)
    setListingActionError('')

    try {
      const closed = await closeListing(listingToClose.listingId)
      const closedStatus = String(closed?.status || 'closed').toLowerCase()

      setOwnedListings((current) =>
        current.map((listing) =>
          listing.listingId === listingToClose.listingId
            ? { ...listing, status: closedStatus }
            : listing,
        ),
      )
      setProjectListings((current) =>
        current.filter((listing) => listing.project_id !== listingToClose.listingId),
      )
      setListingToClose(null)
      setOpenListingMenuId(null)
    } catch (err) {
      setListingActionError(
        err?.message || 'Could not close this listing right now.',
      )
    } finally {
      setClosingListingId(null)
    }
  }

  async function handleReopenListing(listing) {
    if (!listing?.listingId) return

    setReopeningListingId(listing.listingId)
    setListingActionError('')

    try {
      const reopened = await reopenListing(listing.listingId)
      const reopenedStatus = String(reopened?.status || 'open').toLowerCase()

      setOwnedListings((current) =>
        current.map((currentListing) =>
          currentListing.listingId === listing.listingId
            ? { ...currentListing, status: reopenedStatus }
            : currentListing,
        ),
      )
      if (listing.category === 'project') {
        setProjectListings((current) => {
          if (current.some((project) => project.project_id === listing.listingId)) {
            return current
          }

          return [
            {
              project_id: listing.listingId,
              title: listing.title,
              description: listing.description,
              tags: [],
            },
            ...current,
          ]
        })
      }
      setOpenListingMenuId(null)
    } catch (err) {
      setListingActionError(
        err?.message || 'Could not reopen this listing right now.',
      )
    } finally {
      setReopeningListingId(null)
    }
  }

  async function confirmPermanentDeleteListing() {
    if (!listingToDelete?.listingId) return

    setDeletingListingId(listingToDelete.listingId)
    setListingActionError('')

    try {
      await permanentlyDeleteListing(listingToDelete.listingId)
      setOwnedListings((current) =>
        current.filter((listing) => listing.listingId !== listingToDelete.listingId),
      )
      setProjectListings((current) =>
        current.filter((listing) => listing.project_id !== listingToDelete.listingId),
      )
      setRecentActivity((current) =>
        current.filter((activity) => activity.id !== `listing-${listingToDelete.listingId}`),
      )
      setListingToDelete(null)
      setOpenListingMenuId(null)
    } catch (err) {
      setListingActionError(
        err?.message || 'Could not permanently delete this listing right now.',
      )
    } finally {
      setDeletingListingId(null)
    }
  }

  function cancelEdit() {
    setDraft(null)
    setIsEditing(false)
    setErrorMessage('')
  }

  function updateSkill(index, field, value) {
    setDraft((current) => {
      if (!current) return current
      const skills = current.skills.map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, [field]: value } : skill,
      )
      return { ...current, skills }
    })
  }

  function addSkill() {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        skills: [...current.skills, createDraftSkill()],
      }
    })
  }

  function removeSkill(index) {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
      }
    })
  }

  function updateCourse(index, field, value) {
    setDraft((current) => {
      if (!current) return current
      const courses = current.courses.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course,
      )
      return { ...current, courses }
    })
  }

  function addCourse() {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        courses: [...current.courses, createDraftCourse()],
      }
    })
  }

  function removeCourse(index) {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        courses: current.courses.filter(
          (_, courseIndex) => courseIndex !== index,
        ),
      }
    })
  }

  async function saveEdit() {
    if (!draft || !user?.id) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      const savedProfile = await updateProfile(
        user.id,
        buildProfilePayload(draft),
      )
      setProfile(normalizeProfile(savedProfile))
      logInfo('Profile updated', {
        userId: user.id,
        skillCount: draft.skills.length,
        courseCount: draft.courses.length,
      })
      setDraft(null)
      setIsEditing(false)
    } catch (err) {
      logError('Profile update failed', {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      })
      setErrorMessage(err?.message || 'Could not save your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const display = isEditing && draft ? draft : profile ?? EMPTY_PROFILE
  const skills = display.skills ?? []
  const courses = display.courses ?? []

  return (
    <div className="prof-app">
      <TopNav searchPlaceholder="Search for opportunities, skills, or students..." />

      <div className="prof-shell">
        <div id="main-content" role="main" tabIndex={-1} className="prof-main">
          {errorMessage ? (
            <p
              role="alert"
              style={{
                color: '#b00020',
                background: '#fdecea',
                border: '1px solid #f5c2c7',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                marginBottom: '1rem',
              }}
            >
              {errorMessage}
            </p>
          ) : null}

          <header className="prof-hero">
            <div className="prof-hero__banner" />
            <div className="prof-hero__inner">
              <div className="prof-hero__avatar-wrap">
                <div
                  className="prof-hero__avatar"
                  role="img"
                  aria-label={display.full_name || 'Profile avatar'}
                />
                {user?.emailVerified ? (
                  <span className="prof-hero__verified" title="Verified student">
                    <IconVerified />
                  </span>
                ) : null}
              </div>
              <div className="prof-hero__info">
                {isEditing && draft ? (
                  <div className="prof-edit-fields prof-edit-fields--hero">
                    <label className="prof-field">
                      <span>Full name</span>
                      <input
                        value={draft.full_name}
                        onChange={(e) =>
                          setDraft({ ...draft, full_name: e.target.value })
                        }
                      />
                    </label>
                    <label className="prof-field">
                      <span>College</span>
                      <input
                        value={draft.college}
                        onChange={(e) =>
                          setDraft({ ...draft, college: e.target.value })
                        }
                      />
                    </label>
                    <label className="prof-field">
                      <span>Graduation year</span>
                      <input
                        type="number"
                        value={draft.graduation_year}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            graduation_year: Number(e.target.value) || '',
                          })
                        }
                      />
                    </label>
                    <label className="prof-field prof-field--full">
                      <span>Major</span>
                      <input
                        value={draft.major}
                        onChange={(e) =>
                          setDraft({ ...draft, major: e.target.value })
                        }
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <h1 className="prof-hero__name">
                      {display.full_name || 'Your profile'}
                    </h1>
                    <p className="prof-hero__line">
                      {display.college || 'College not set'} • Class of{' '}
                      {display.graduation_year || '—'}
                    </p>
                    <p className="prof-hero__major">
                      {display.major || 'Major not set'}
                    </p>
                  </>
                )}
                <div className="prof-hero__actions">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="prof-btn prof-btn--primary"
                        onClick={saveEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        className="prof-btn prof-btn--outline"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="prof-btn prof-btn--primary"
                        onClick={startEdit}
                        disabled={isLoading}
                      >
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        className="prof-icon-round"
                        aria-label="Share profile"
                      >
                        <IconShare />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="prof-stats">
            <div className="prof-stats__item">
              <strong>{isLoading ? '—' : skills.length}</strong>
              <span>Skills</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{isLoading ? '—' : courses.length}</strong>
              <span>Courses</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{isLoading ? '—' : projectListings.length}</strong>
              <span>Projects</span>
            </div>
            <div className="prof-stats__sep" />
            <div className="prof-stats__item">
              <strong>{isLoading ? '—' : recentActivity.length}</strong>
              <span>Recent updates</span>
            </div>
          </div>

          <section className="prof-section">
            <h2 className="prof-section__title">
              <IconUserDoc />
              About
            </h2>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <span>Bio</span>
                <textarea
                  rows={5}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </label>
            ) : (
              <p className="prof-section__body">
                {isLoading
                  ? 'Loading profile...'
                  : display.bio || 'Add a short bio to introduce yourself.'}
              </p>
            )}
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Skills &amp; Expertise</h2>
              {isEditing ? (
                <button
                  type="button"
                  className="prof-link-btn"
                  onClick={addSkill}
                  disabled={isSaving}
                >
                  + Add Skill
                </button>
              ) : null}
            </div>
            {isEditing && draft ? (
              <div className="prof-editor-list">
                {skills.length === 0 ? (
                  <p className="prof-section__body">
                    Add skills you can teach, use, or want help with.
                  </p>
                ) : null}
                {skills.map((skill, index) => (
                  <div key={skill.user_skill_id} className="prof-editor-card">
                    <div className="prof-editor-grid prof-editor-grid--skills">
                      <label className="prof-field">
                        <span>Skill</span>
                        <input
                          value={skill.skill_name}
                          onChange={(e) =>
                            updateSkill(index, 'skill_name', e.target.value)
                          }
                          placeholder="React"
                        />
                      </label>
                      <label className="prof-field">
                        <span>Category</span>
                        <input
                          value={skill.category}
                          onChange={(e) =>
                            updateSkill(index, 'category', e.target.value)
                          }
                          placeholder="Frameworks"
                        />
                      </label>
                      <label className="prof-field">
                        <span>Level</span>
                        <select
                          value={skill.proficiency_level || 'intermediate'}
                          onChange={(e) =>
                            updateSkill(
                              index,
                              'proficiency_level',
                              e.target.value,
                            )
                          }
                        >
                          {PROFICIENCY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="prof-editor-actions">
                      <label className="prof-check">
                        <input
                          type="checkbox"
                          checked={Boolean(skill.is_offering_help)}
                          onChange={(e) =>
                            updateSkill(
                              index,
                              'is_offering_help',
                              e.target.checked,
                            )
                          }
                        />
                        <span>I can help others with this</span>
                      </label>
                      <label className="prof-check">
                        <input
                          type="checkbox"
                          checked={Boolean(skill.is_seeking_help)}
                          onChange={(e) =>
                            updateSkill(
                              index,
                              'is_seeking_help',
                              e.target.checked,
                            )
                          }
                        />
                        <span>I want help with this</span>
                      </label>
                      <button
                        type="button"
                        className="prof-remove-btn"
                        onClick={() => removeSkill(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prof-skills">
                {skills.length === 0 ? (
                  <p className="prof-section__body">No skills added yet.</p>
                ) : (
                  skills.map((skill) => (
                    <div key={skill.user_skill_id} className="prof-skill-card">
                      <span
                        className={skillIconClass(skill.skill_name)}
                        aria-hidden
                      >
                        {'</>'}
                      </span>
                      <div>
                        <div className="prof-skill-card__name">
                          {skill.skill_name}
                        </div>
                        <div className="prof-skill-card__level">
                          {skill.proficiency_level || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Completed Courses</h2>
              {isEditing ? (
                <button
                  type="button"
                  className="prof-link-btn"
                  onClick={addCourse}
                  disabled={isSaving}
                >
                  + Add Course
                </button>
              ) : (
                <Link className="prof-text-link" to="/opportunities">
                  View All ({courses.length})
                </Link>
              )}
            </div>
            {isEditing && draft ? (
              <div className="prof-editor-list">
                {courses.length === 0 ? (
                  <p className="prof-section__body">
                    Add completed or in-progress classes to strengthen your
                    profile.
                  </p>
                ) : null}
                {courses.map((course, index) => (
                  <div key={course.user_course_id} className="prof-editor-card">
                    <div className="prof-editor-grid prof-editor-grid--courses">
                      <label className="prof-field">
                        <span>Course code</span>
                        <input
                          value={course.course_code}
                          onChange={(e) =>
                            updateCourse(index, 'course_code', e.target.value)
                          }
                          placeholder="COMPSCI 520"
                        />
                      </label>
                      <label className="prof-field">
                        <span>Course name</span>
                        <input
                          value={course.course_name}
                          onChange={(e) =>
                            updateCourse(index, 'course_name', e.target.value)
                          }
                          placeholder="Software Engineering"
                        />
                      </label>
                      <label className="prof-field">
                        <span>Institution</span>
                        <input
                          value={course.institution}
                          onChange={(e) =>
                            updateCourse(index, 'institution', e.target.value)
                          }
                          placeholder="UMass Amherst"
                        />
                      </label>
                      <label className="prof-field">
                        <span>Status</span>
                        <select
                          value={course.status || 'completed'}
                          onChange={(e) =>
                            updateCourse(index, 'status', e.target.value)
                          }
                        >
                          {COURSE_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="prof-field">
                        <span>Grade</span>
                        <input
                          value={course.grade}
                          onChange={(e) =>
                            updateCourse(index, 'grade', e.target.value)
                          }
                          placeholder="A"
                        />
                      </label>
                    </div>
                    <div className="prof-editor-actions">
                      <button
                        type="button"
                        className="prof-remove-btn"
                        onClick={() => removeCourse(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prof-courses">
                {courses.length === 0 ? (
                  <p className="prof-section__body">No courses added yet.</p>
                ) : (
                  courses.map((course) => (
                    <div key={course.user_course_id} className="prof-course-card">
                      <div className="prof-course-card__name">
                        {course.course_code} {course.course_name}
                      </div>
                      <div className="prof-course-card__grade">
                        {course.grade || '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="prof-section">
            <div className="prof-section__head">
              <h2 className="prof-section__title">Featured Projects</h2>
              {isEditing ? (
                <button
                  type="button"
                  className="prof-link-btn"
                  disabled
                >
                  + Add Project
                </button>
              ) : (
                <Link className="prof-text-link" to="/postings/new">
                  Create Project
                </Link>
              )}
            </div>
            <div className="prof-projects">
              {isLoading ? (
                <p className="prof-section__body">Loading projects...</p>
              ) : projectListings.length === 0 ? (
                <p className="prof-section__body">
                  No project listings yet. Create a posting in the project
                  category to show work here.
                </p>
              ) : (
                projectListings.map((project) => (
                  <article key={project.project_id} className="prof-project-card">
                    <div className="prof-project-card__thumb" aria-hidden />
                    <div className="prof-project-card__body">
                      <h3 className="prof-project-card__title">{project.title}</h3>
                      <p className="prof-project-card__desc">
                        {project.description}
                      </p>
                      {project.tags.length > 0 ? (
                        <div className="prof-project-card__tags">
                          {project.tags.map((tag) => (
                            <span key={tag} className="prof-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="prof-section" id="my-applications">
            <div className="prof-section__head">
              <h2 className="prof-section__title">My Applications</h2>
              <Link className="prof-text-link" to="/opportunities">
                Find Opportunities
              </Link>
            </div>
            <div className="prof-applications">
              {isLoading ? (
                <p className="prof-section__body">Loading applications...</p>
              ) : appliedApplications.length === 0 ? (
                <p className="prof-section__body">
                  You have not applied to any listings yet.
                </p>
              ) : (
                appliedApplications.map((application) => (
                  <article
                    key={application.applicationId}
                    className="prof-application-card"
                  >
                    <div className="prof-application-card__main">
                      <div className="prof-listing-card__topline">
                        <span className="prof-listing-card__category">
                          {application.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="prof-listing-card__title">
                        {application.title}
                      </h3>
                      {application.message ? (
                        <p className="prof-listing-card__desc">
                          {application.message}
                        </p>
                      ) : null}
                      <p className="prof-listing-card__meta">
                        Applied {formatRelativeTime(application.submittedAt)}
                      </p>
                    </div>
                    <div className="prof-application-card__side">
                      <span
                        className={`prof-application-card__status prof-application-card__status--${application.applicationStatus}`}
                      >
                        {application.applicationStatus}
                      </span>
                      {application.listingStatus ? (
                        <span className="prof-application-card__listing-status">
                          Listing {application.listingStatus}
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="prof-section" id="my-listings">
            <div className="prof-section__head">
              <h2 className="prof-section__title">My Listings</h2>
              <Link className="prof-text-link" to="/postings/new">
                Create Listing
              </Link>
            </div>
            {listingActionError ? (
              <p className="prof-listings__error" role="alert">
                {listingActionError}
              </p>
            ) : null}
            <div className="prof-listings">
              {isLoading ? (
                <p className="prof-section__body">Loading listings...</p>
              ) : ownedListings.length === 0 ? (
                <p className="prof-section__body">
                  You have not created any listings yet.
                </p>
              ) : (
                ownedListings.map((listing) => {
                  const isOpen = listing.status === 'open'
                  const isClosing = closingListingId === listing.listingId
                  const isReopening = reopeningListingId === listing.listingId
                  const isDeleting = deletingListingId === listing.listingId

                  return (
                    <article key={listing.listingId} className="prof-listing-card">
                      <div className="prof-listing-card__menu">
                        <button
                          type="button"
                          className="prof-listing-card__menu-button"
                          aria-label={`Open actions for ${listing.title}`}
                          aria-expanded={openListingMenuId === listing.listingId}
                          onClick={() =>
                            setOpenListingMenuId((current) =>
                              current === listing.listingId ? null : listing.listingId,
                            )
                          }
                        >
                          <span />
                          <span />
                          <span />
                        </button>
                        {openListingMenuId === listing.listingId ? (
                          <div className="prof-listing-card__menu-popover">
                            {isOpen ? (
                              <button
                                type="button"
                                className="prof-listing-card__menu-item"
                                onClick={() => {
                                  setListingActionError('')
                                  setListingToClose(listing)
                                  setOpenListingMenuId(null)
                                }}
                                disabled={isClosing}
                              >
                                {isClosing ? 'Closing...' : 'Close listing'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="prof-listing-card__menu-item"
                                onClick={() => handleReopenListing(listing)}
                                disabled={isReopening}
                              >
                                {isReopening ? 'Reopening...' : 'Reopen listing'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="prof-listing-card__menu-item prof-listing-card__menu-item--danger"
                              onClick={() => {
                                setListingActionError('')
                                setListingToDelete(listing)
                                setOpenListingMenuId(null)
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete listing'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="prof-listing-card__main">
                        <div className="prof-listing-card__topline">
                          <span className="prof-listing-card__category">
                            {listing.category.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="prof-listing-card__title">
                          {listing.title}
                        </h3>
                        <p className="prof-listing-card__desc">
                          {listing.description}
                        </p>
                        <p className="prof-listing-card__meta">
                          Created {formatRelativeTime(listing.createdAt)}
                        </p>
                      </div>
                      <div className="prof-listing-card__actions">
                        <Link
                          className="prof-btn prof-btn--outline"
                          to={`/postings/${listing.listingId}/applications`}
                          state={{
                            returnTo: {
                              path: '/profile#my-listings',
                              label: 'Back to profile',
                            },
                          }}
                        >
                          View Applications
                        </Link>
                        <span
                          className={
                            isOpen
                              ? 'prof-listing-card__status prof-listing-card__status--open'
                              : 'prof-listing-card__status prof-listing-card__status--closed'
                          }
                        >
                          {listing.status}
                        </span>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </div>

        <aside className="prof-aside">
          <section className="prof-card">
            <h3 className="prof-card__title">Availability</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <textarea
                  rows={3}
                  value={draft.availability}
                  onChange={(e) =>
                    setDraft({ ...draft, availability: e.target.value })
                  }
                />
              </label>
            ) : (
              <p className="prof-card__text">
                {display.availability || 'Add your availability.'}
              </p>
            )}
            <span className="prof-pill prof-pill--ok">
              Available for opportunities
            </span>
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Contact</h3>
            <ul className="prof-contact-list">
              <li>
                <IconMail />
                {user?.email || 'Email unavailable'}
              </li>
              <li>
                <IconPin />
                {display.college || 'Location unavailable'}
              </li>
              <li>
                <IconGithub />
                <span>GitHub not connected</span>
              </li>
            </ul>
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Looking for</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <textarea
                  rows={3}
                  value={draft.looking_for}
                  onChange={(e) =>
                    setDraft({ ...draft, looking_for: e.target.value })
                  }
                />
              </label>
            ) : (
              <p className="prof-card__text">
                {display.looking_for || 'Add what you are looking for.'}
              </p>
            )}
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Interests</h3>
            {isEditing && draft ? (
              <label className="prof-field prof-field--block">
                <span>Interests (comma-separated)</span>
                <textarea
                  rows={2}
                  value={draft.interests}
                  onChange={(e) =>
                    setDraft({ ...draft, interests: e.target.value })
                  }
                />
              </label>
            ) : (
              <div className="prof-tags">
                {display.interests
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="prof-tag prof-tag--muted">
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </section>

          <section className="prof-card">
            <h3 className="prof-card__title">Recent Activity</h3>
            <ul className="prof-activity">
              {isLoading ? (
                <li>
                  <span className="prof-activity__dot" />
                  <div>
                    <p>Loading activity...</p>
                  </div>
                </li>
              ) : recentActivity.length === 0 ? (
                <li>
                  <span className="prof-activity__dot" />
                  <div>
                    <p>No recent activity yet.</p>
                  </div>
                </li>
              ) : (
                recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <span className="prof-activity__dot" />
                    <div>
                      <p>{activity.message}</p>
                      <time>{activity.occurred_at_label}</time>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </div>

      {listingToClose ? (
        <div className="fcc-modal-backdrop" role="presentation">
          <div
            className="fcc-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-close-listing-title"
          >
            <p className="fcc-application-modal__eyebrow">Close listing</p>
            <h2
              id="profile-close-listing-title"
              className="fcc-confirm-modal__title"
            >
              Take this listing down?
            </h2>
            <p className="fcc-confirm-modal__body">
              {listingToClose.title} will no longer appear in the opportunities
              feed, but applications and history will be kept.
            </p>
            <div className="fcc-confirm-modal__actions">
              <button
                type="button"
                className="fcc-btn fcc-btn--outline"
                onClick={() => setListingToClose(null)}
                disabled={Boolean(closingListingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fcc-btn fcc-btn--danger"
                onClick={confirmCloseListing}
                disabled={Boolean(closingListingId)}
              >
                {closingListingId ? 'Closing...' : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {listingToDelete ? (
        <div className="fcc-modal-backdrop" role="presentation">
          <div
            className="fcc-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-delete-listing-title"
          >
            <p className="fcc-application-modal__eyebrow">Delete listing</p>
            <h2
              id="profile-delete-listing-title"
              className="fcc-confirm-modal__title"
            >
              Permanently delete this listing?
            </h2>
            <p className="fcc-confirm-modal__body">
              This cannot be undone. {listingToDelete.title} and its
              applications will be permanently deleted.
            </p>
            <div className="fcc-confirm-modal__actions">
              <button
                type="button"
                className="fcc-btn fcc-btn--outline"
                onClick={() => setListingToDelete(null)}
                disabled={Boolean(deletingListingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fcc-btn fcc-btn--danger"
                onClick={confirmPermanentDeleteListing}
                disabled={Boolean(deletingListingId)}
              >
                {deletingListingId ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
