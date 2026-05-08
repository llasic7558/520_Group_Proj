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
import { getUser } from '../../lib/authStorage.js'
import EmailVerificationBanner from '../../components/EmailVerificationBanner.jsx'
import AddProfileProjectModal from '../../components/profile/AddProfileProjectModal.jsx'
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
import { resolveProfileImageUrl } from '../../lib/profileImageUrl.js'
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

const PROFILE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

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

/** Max project cards shown in Featured Projects before requiring "View All". */
const FEATURED_PROJECTS_PREVIEW_MAX = 2

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
  // The API returns camelCase, while this page's edit controls use the
  // database-style names from the original mock profile data.
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
  // Convert the page's snake_case draft back to the backend's camelCase contract.
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

  // Featured Projects is a profile-specific view of the user's project listings.
  return items.map((listing) => ({
    project_id: listing.listingId,
    title: listing.title || 'Untitled project',
    description: listing.description || 'No description provided.',
    image_url: listing.bannerImageUrl || listing.banner_image_url || '',
    tags: Array.isArray(listing.skills)
      ? listing.skills
          .map((skill) => skill.name)
          .filter(Boolean)
          .slice(0, 12)
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

  // Application rows only include listing ids, so callers pass the fetched
  // listings map to render readable titles and listing status.
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

async function loadImageForCanvas(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through to Image() */
    }
  }

  // Safari and older browsers may not support createImageBitmap for every
  // uploaded file type, so fall back to object URLs plus Image().
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Could not load image.'))
      img.src = objectUrl
    })
    return img
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Resize and compress to JPEG data URL for storage in profile_image_url.
 */
async function fileToProfileImageDataUrl(file, maxEdge = 512, maxChars = 400_000) {
  const allowed = new Set(PROFILE_PHOTO_ACCEPT.split(','))
  if (!file?.type || !allowed.has(file.type)) {
    throw new Error('Please choose a JPEG, PNG, WebP, or GIF image.')
  }

  const source = await loadImageForCanvas(file)
  const sw = source.width ?? source.naturalWidth
  const sh = source.height ?? source.naturalHeight
  if (!sw || !sh) {
    source.close?.()
    throw new Error('Could not read image dimensions.')
  }

  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const tw = Math.max(1, Math.round(sw * scale))
  const th = Math.max(1, Math.round(sh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    source.close?.()
    throw new Error('Could not process image in this browser.')
  }

  ctx.drawImage(source, 0, 0, tw, th)
  source.close?.()

  let quality = 0.9
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  // Keep profile photos small enough to store as text in profile_image_url.
  while (dataUrl.length > maxChars && quality > 0.52) {
    quality -= 0.07
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if (dataUrl.length > maxChars) {
    throw new Error('Image is still too large after compressing. Try a smaller file.')
  }

  return dataUrl
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
  const { user, updateUser } = useAuth()
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
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [featuredProjectsExpanded, setFeaturedProjectsExpanded] = useState(false)
  const [profilePhotoError, setProfilePhotoError] = useState('')

  useEffect(() => {
    if (!isEditing) {
      setFeaturedProjectsExpanded(false)
    }
  }, [isEditing])

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
        // Use allSettled so the profile can still render if listings or
        // applications fail independently.
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
          const normalized = normalizeProfile(profileResult.value)
          setProfile(normalized)
          const stored = getUser()
          if (stored?.id === user.id) {
            updateUser({
              ...stored,
              profileImageUrl: (normalized.profile_image_url || '').trim(),
            })
          }
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

        // Fetch each applied-to listing once so application cards and recent
        // activity can show titles instead of raw UUIDs.
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
  }, [user?.id, updateUser])

  function startEdit() {
    if (!profile) return
    setDraft({
      ...profile,
      skills: profile.skills.map((skill) => ({ ...skill })),
      courses: profile.courses.map((course) => ({ ...course })),
    })
    setProfilePhotoError('')
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

          const [next] = normalizeProjectListings([reopened])
          return next ? [next, ...current] : current
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

  function handleFeaturedProjectCreated(listing) {
    if (!listing) return

    setOwnedListings((prev) => {
      const [next] = normalizeOwnedListings([listing])
      if (!next) return prev
      return [next, ...prev.filter((l) => l.listingId !== next.listingId)]
    })
    setProjectListings((prev) => {
      const [next] = normalizeProjectListings([listing])
      if (!next) return prev
      return [next, ...prev.filter((p) => p.project_id !== next.project_id)]
    })
    const occurredAt = listing.createdAt || new Date().toISOString()
    setRecentActivity((prev) =>
      [
        {
          id: `listing-${listing.listingId}`,
          message: `Created a project posting: ${listing.title}`,
          occurredAt,
          occurred_at_label: 'Just now',
        },
        ...prev.filter((a) => a.id !== `listing-${listing.listingId}`),
      ].slice(0, 6),
    )
  }

  function cancelEdit() {
    setDraft(null)
    setIsEditing(false)
    setErrorMessage('')
    setProfilePhotoError('')
  }

  async function handleProfilePhotoChange(event) {
    const input = event.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setProfilePhotoError('')
    try {
      const dataUrl = await fileToProfileImageDataUrl(file)
      setDraft((current) =>
        current ? { ...current, profile_image_url: dataUrl } : current,
      )
    } catch (err) {
      setProfilePhotoError(
        err instanceof Error ? err.message : 'Could not use that image.',
      )
    }
  }

  function clearProfilePhoto() {
    setProfilePhotoError('')
    setDraft((current) =>
      current ? { ...current, profile_image_url: '' } : current,
    )
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
      const stored = getUser()
      if (stored) {
        updateUser({
          ...stored,
          profileImageUrl: (savedProfile.profileImageUrl ?? '').trim(),
        })
      }
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

  const featuredProjectsOverflow =
    projectListings.length > FEATURED_PROJECTS_PREVIEW_MAX
  const visibleFeaturedProjects =
    isEditing || !featuredProjectsOverflow || featuredProjectsExpanded
      ? projectListings
      : projectListings.slice(0, FEATURED_PROJECTS_PREVIEW_MAX)

  const newestOwnedListingForApplications =
    ownedListings.length > 0
      ? [...ownedListings].sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        )[0]
      : null

  const profilePhotoSrc = resolveProfileImageUrl(display.profile_image_url)

  return (
    <div className="prof-app">
      <TopNav searchPlaceholder="Search for opportunities, skills, or students..." />
      <EmailVerificationBanner />

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
                  className={
                    profilePhotoSrc
                      ? 'prof-hero__avatar prof-hero__avatar--photo'
                      : 'prof-hero__avatar'
                  }
                  role="img"
                  aria-label={display.full_name || 'Profile avatar'}
                  style={
                    profilePhotoSrc
                      ? {
                          backgroundImage: `url(${JSON.stringify(profilePhotoSrc)})`,
                        }
                      : undefined
                  }
                />
                {user?.emailVerified ? (
                  <span className="prof-hero__verified" title="Verified student">
                    <IconVerified />
                  </span>
                ) : null}
                {isEditing && draft ? (
                  <div className="prof-hero__photo-actions">
                    <input
                      id="prof-profile-photo-input"
                      type="file"
                      className="prof-hero__photo-input"
                      accept={PROFILE_PHOTO_ACCEPT}
                      onChange={handleProfilePhotoChange}
                    />
                    <label
                      htmlFor="prof-profile-photo-input"
                      className="prof-hero__photo-upload-label"
                    >
                      Upload photo
                    </label>
                    {draft.profile_image_url?.trim() ? (
                      <button
                        type="button"
                        className="prof-link-btn prof-hero__photo-remove"
                        onClick={clearProfilePhoto}
                        disabled={isSaving}
                      >
                        Remove photo
                      </button>
                    ) : null}
                    {profilePhotoError ? (
                      <p className="prof-hero__photo-error" role="alert">
                        {profilePhotoError}
                      </p>
                    ) : null}
                  </div>
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
              <h2 className="prof-section__title">
                <svg
                  className="prof-section__icon-folder"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Featured Projects
              </h2>
              {isEditing ? (
                <button
                  type="button"
                  className="prof-link-btn"
                  onClick={() => setIsAddProjectOpen(true)}
                  disabled={isSaving || isLoading}
                >
                  + Add Project
                </button>
              ) : featuredProjectsOverflow ? (
                <button
                  type="button"
                  className="prof-view-all-btn"
                  onClick={() =>
                    setFeaturedProjectsExpanded((current) => !current)
                  }
                >
                  {featuredProjectsExpanded
                    ? 'Show less'
                    : `View All (${projectListings.length})`}
                </button>
              ) : null}
            </div>
            <div className="prof-projects">
              {isLoading ? (
                <p className="prof-section__body">Loading projects...</p>
              ) : projectListings.length === 0 ? (
                <p className="prof-section__body">
                  You have not added any project yet.
                </p>
              ) : (
                visibleFeaturedProjects.map((project) => (
                  <article key={project.project_id} className="prof-project-card">
                    <div
                      className={
                        project.image_url
                          ? 'prof-project-card__media prof-project-card__media--image'
                          : 'prof-project-card__media'
                      }
                      style={
                        project.image_url
                          ? { backgroundImage: `url(${project.image_url})` }
                          : undefined
                      }
                      aria-hidden
                    />
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
              {isEditing ? (
                <Link className="prof-text-link" to="/postings/new">
                  Create listing
                </Link>
              ) : newestOwnedListingForApplications ? (
                <Link
                  className="prof-text-link"
                  to={`/postings/${newestOwnedListingForApplications.listingId}/applications`}
                  state={{
                    returnTo: {
                      path: '/profile#my-listings',
                      label: 'Back to profile',
                    },
                  }}
                  title={
                    ownedListings.length > 1
                      ? 'Applications for your most recently created listing'
                      : undefined
                  }
                >
                  View applications
                </Link>
              ) : null}
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

                  const listingReturnState = {
                    returnTo: {
                      path: '/profile#my-listings',
                      label: 'Back to profile',
                    },
                  }

                  const isMenuOpen = openListingMenuId === listing.listingId

                  return (
                    <article
                      key={listing.listingId}
                      className={
                        isMenuOpen
                          ? 'prof-listing-card prof-listing-card--menu-open'
                          : 'prof-listing-card'
                      }
                    >
                      <Link
                        className="prof-listing-card__main prof-listing-card__main--link"
                        to={`/postings/${listing.listingId}/applications`}
                        state={listingReturnState}
                      >
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
                      </Link>
                      <div className="prof-listing-card__rail">
                        <div className="prof-listing-card__menu">
                          <button
                            type="button"
                            className="prof-listing-card__menu-button"
                            aria-label={`Open actions for ${listing.title}`}
                            aria-expanded={isMenuOpen}
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
                          {isMenuOpen ? (
                            <div className="prof-listing-card__menu-popover">
                              {isOpen ? (
                                <>
                                  <Link
                                    className="prof-listing-card__menu-item"
                                    to={`/postings/${listing.listingId}/edit`}
                                    onClick={() => {
                                      setListingActionError('')
                                      setOpenListingMenuId(null)
                                    }}
                                  >
                                    Edit listing
                                  </Link>
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
                                </>
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

      <AddProfileProjectModal
        open={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onCreated={handleFeaturedProjectCreated}
      />
    </div>
  )
}
