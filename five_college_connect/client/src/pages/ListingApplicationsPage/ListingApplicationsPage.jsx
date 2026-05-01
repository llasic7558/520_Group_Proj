import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ProfilePreviewModal from '../../components/ProfilePreviewModal.jsx'
import { TopNav } from '../../components/opportunities/TopNav.jsx'
import {
  IconClock,
  IconMessage,
  IconVerified,
} from '../../components/opportunities/Icons.jsx'
import { useAuth } from '../../context/AuthContext.js'
import {
  fetchApplications,
  fetchListing,
  fetchProfile,
  updateApplicationStatus,
} from '../../lib/api.js'
import '../OpportunitiesPage/OpportunitiesPage.css'
import './ListingApplicationsPage.css'

function formatSubmittedAt(value) {
  if (!value) return 'Submitted recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Submitted recently'

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function applicantName(profile, application) {
  return (
    profile?.fullName ||
    profile?.full_name ||
    `Applicant ${application.applicantUserId?.slice(0, 8) || ''}`
  )
}

function applicantSubtitle(profile) {
  const college = profile?.college
  const major = profile?.major
  return [college, major].filter(Boolean).join(' • ') || 'Profile unavailable'
}

export default function ListingApplicationsPage() {
  const { listingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [applications, setApplications] = useState([])
  const [profilesByUserId, setProfilesByUserId] = useState({})
  const [selectedApplicantUserId, setSelectedApplicantUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusErrorMessage, setStatusErrorMessage] = useState('')
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadListingApplications() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const loadedListing = await fetchListing(listingId)

        if (!loadedListing) {
          throw new Error('Listing not found.')
        }

        if (loadedListing.createdByUserId !== user?.id) {
          throw new Error('Only the listing owner can view applications.')
        }

        const loadedApplications = await fetchApplications({
          listingId,
          limit: 50,
        })

        const profileResults = await Promise.allSettled(
          loadedApplications.map((application) =>
            fetchProfile(application.applicantUserId),
          ),
        )

        if (ignore) return

        const nextProfilesByUserId = {}
        profileResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            nextProfilesByUserId[
              loadedApplications[index].applicantUserId
            ] = result.value
          }
        })

        setListing(loadedListing)
        setApplications(loadedApplications)
        setProfilesByUserId(nextProfilesByUserId)
        setSelectedApplicantUserId(null)
        setStatusErrorMessage('')
      } catch (err) {
        if (ignore) return
        setListing(null)
        setApplications([])
        setProfilesByUserId({})
        setSelectedApplicantUserId(null)
        setErrorMessage(
          err?.message || 'Could not load applications for this listing.',
        )
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadListingApplications()

    return () => {
      ignore = true
    }
  }, [listingId, user?.id])

  const applicationCountLabel = useMemo(() => {
    const count = applications.length
    return `${count} ${count === 1 ? 'application' : 'applications'}`
  }, [applications.length])

  const selectedProfile = selectedApplicantUserId
    ? profilesByUserId[selectedApplicantUserId]
    : null
  const returnTarget =
    location.state?.returnTo &&
    typeof location.state.returnTo.path === 'string' &&
    typeof location.state.returnTo.label === 'string'
      ? location.state.returnTo
      : {
          path: '/opportunities',
          label: 'Back to opportunities',
        }

  function handleBack() {
    if (location.state?.returnTo && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(returnTarget.path)
  }

  async function handleApplicationStatusChange(applicationId, status) {
    setUpdatingApplicationId(applicationId)
    setStatusErrorMessage('')

    try {
      const updatedApplication = await updateApplicationStatus(applicationId, status)
      setApplications((current) =>
        current.map((application) =>
          application.applicationId === applicationId
            ? { ...application, status: updatedApplication?.status || status }
            : application,
        ),
      )
    } catch (err) {
      setStatusErrorMessage(
        err?.message || 'Could not update this application right now.',
      )
    } finally {
      setUpdatingApplicationId(null)
    }
  }

  return (
    <div className="fcc-app">
      <TopNav searchPlaceholder="Search opportunities..." />

      <main id="main-content" tabIndex={-1} className="applications-page">
        <div className="applications-page__inner">
          <button
            type="button"
            className="applications-page__back"
            onClick={handleBack}
          >
            {returnTarget.label}
          </button>

          <header className="applications-page__header">
            <div>
              <p className="applications-page__eyebrow">Listing applications</p>
              <h1 className="applications-page__title">
                {listing?.title || 'Applications'}
              </h1>
              <p className="applications-page__subtitle">
                {isLoading
                  ? 'Loading applications...'
                  : errorMessage || applicationCountLabel}
              </p>
            </div>
          </header>

          {statusErrorMessage ? (
            <p className="applications-page__error" role="alert">
              {statusErrorMessage}
            </p>
          ) : null}

          {isLoading ? (
            <section className="applications-page__empty">
              <p>Loading applications...</p>
            </section>
          ) : errorMessage ? (
            <section className="applications-page__empty" role="alert">
              <p>{errorMessage}</p>
            </section>
          ) : applications.length === 0 ? (
            <section className="applications-page__empty">
              <IconMessage />
              <p>No applications have been submitted for this listing yet.</p>
            </section>
          ) : (
            <div className="applications-list">
              {applications.map((application) => {
                const profile = profilesByUserId[application.applicantUserId]
                const isUpdating =
                  updatingApplicationId === application.applicationId
                const normalizedStatus = String(
                  application.status || 'pending',
                ).toLowerCase()

                return (
                  <article
                    key={application.applicationId}
                    className="application-card"
                  >
                    <div className="application-card__top">
                      <button
                        type="button"
                        className="application-card__avatar"
                        aria-label={`View ${applicantName(profile, application)} profile`}
                        onClick={() =>
                          setSelectedApplicantUserId(
                            application.applicantUserId,
                          )
                        }
                        disabled={!profile}
                      >
                        {applicantName(profile, application).slice(0, 1)}
                      </button>
                      <div className="application-card__identity">
                        <button
                          type="button"
                          className="application-card__name"
                          onClick={() =>
                            setSelectedApplicantUserId(
                              application.applicantUserId,
                            )
                          }
                          disabled={!profile}
                        >
                          {applicantName(profile, application)}
                        </button>
                        <p className="application-card__subtitle">
                          {applicantSubtitle(profile)}
                        </p>
                      </div>
                      <span
                        className={`application-card__status application-card__status--${normalizedStatus}`}
                      >
                        {application.status || 'pending'}
                      </span>
                    </div>

                    <p className="application-card__message">
                      {application.message || 'No message included.'}
                    </p>

                    <footer className="application-card__footer">
                      <span>
                        <IconClock />
                        {formatSubmittedAt(application.submittedAt)}
                      </span>
                      {profile ? (
                        <span>
                          <IconVerified />
                          Profile attached
                        </span>
                      ) : null}
                      <span className="application-card__applicant-id">
                        Applicant ID: {application.applicantUserId}
                      </span>
                    </footer>

                    <div className="application-card__actions">
                      <button
                        type="button"
                        className="fcc-btn fcc-btn--primary"
                        onClick={() =>
                          handleApplicationStatusChange(
                            application.applicationId,
                            'accepted',
                          )
                        }
                        disabled={isUpdating || normalizedStatus === 'accepted'}
                      >
                        {isUpdating ? 'Updating...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        className="fcc-btn fcc-btn--danger"
                        onClick={() =>
                          handleApplicationStatusChange(
                            application.applicationId,
                            'rejected',
                          )
                        }
                        disabled={isUpdating || normalizedStatus === 'rejected'}
                      >
                        {isUpdating ? 'Updating...' : 'Reject'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <ProfilePreviewModal
        profile={selectedProfile}
        closeLabel="Back to applications"
        onClose={() => setSelectedApplicantUserId(null)}
      />
    </div>
  )
}
