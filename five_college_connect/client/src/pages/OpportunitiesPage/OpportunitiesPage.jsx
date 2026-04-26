import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { CATEGORY_IDS, getListingId } from '../../data/postings.js'
import { OpportunityDetail } from '../../components/opportunities/OpportunityDetail.jsx'
import { PostingList } from '../../components/opportunities/PostingList.jsx'
import { TopNav } from '../../components/opportunities/TopNav.jsx'
import EmailVerificationBanner from '../../components/EmailVerificationBanner.jsx'
import WelcomeBanner from '../../components/WelcomeBanner.jsx'
import { fetchApplications, fetchListings } from '../../lib/api.js'
import { logError, logInfo } from '../../lib/logger.js'
import './OpportunitiesPage.css'

function normalizeListing(listing) {
  const skills = Array.isArray(listing?.skills) ? listing.skills : []
  const profile = listing?.creator?.profile

  return {
    listing_id: listing?.listingId ?? null,
    created_by_user_id: listing?.createdByUserId ?? null,
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    category: String(listing?.category || '').toLowerCase(),
    contact_method: listing?.contactMethod ?? '',
    contact_details: listing?.contactDetails ?? '',
    banner_image_url: listing?.bannerImageUrl || null,
    custom_color: listing?.customColor || null,
    status: listing?.status ?? '',
    expiration_date: listing?.expirationDate ?? null,
    created_at: listing?.createdAt ?? null,
    updated_at: listing?.updatedAt ?? null,
    listing_skills: skills.map((skill) => ({
      listing_skill_id: skill.listingSkillId,
      listing_id: skill.listingId,
      skill_id: skill.skillId,
      skill_name: skill.name,
      category: skill.category,
      requirement_type: skill.requirementType,
    })),
    creator: listing?.creator
      ? {
          user_id: listing.creator.userId,
          email_verified: Boolean(listing.creator.emailVerified),
          teacher_badge: Boolean(listing.creator.teacherBadge),
          profile: profile
            ? {
                profile_id: profile.profileId,
                user_id: profile.userId,
                full_name: profile.fullName,
                bio: profile.bio,
                college: profile.college,
                major: profile.major,
                graduation_year: profile.graduationYear,
                interests: profile.interests,
                availability: profile.availability,
                looking_for: profile.lookingFor,
                profile_image_url: profile.profileImageUrl,
              }
            : null,
        }
      : null,
    location_short: '',
    compensation_summary: '',
    preferred_availability: [],
    card_skill_labels: skills.map((skill) => skill.name).filter(Boolean).slice(0, 3),
  }
}

export default function OpportunitiesPage() {
  const [activeFilter, setActiveFilter] = useState(CATEGORY_IDS.ALL)
  const [searchValue, setSearchValue] = useState('')
  const [postings, setPostings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [appliedListingIds, setAppliedListingIds] = useState(() => new Set())

  const deferredQuery = useDeferredValue(searchValue.trim())

  useEffect(() => {
    let ignore = false

    async function loadListings() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const items = await fetchListings({
          category:
            activeFilter === CATEGORY_IDS.ALL ? undefined : activeFilter,
          query: deferredQuery,
          limit: 20,
        })

        if (ignore) return
        logInfo('Opportunities loaded', {
          category:
            activeFilter === CATEGORY_IDS.ALL ? 'all' : activeFilter,
          query: deferredQuery,
          count: items.length,
        })
        setPostings(items.map(normalizeListing))
      } catch (err) {
        if (ignore) return
        logError('Opportunities failed to load', {
          category:
            activeFilter === CATEGORY_IDS.ALL ? 'all' : activeFilter,
          query: deferredQuery,
          error: err instanceof Error ? err.message : String(err),
        })
        setPostings([])
        setErrorMessage(
          err?.message || 'Could not load opportunities right now.',
        )
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadListings()

    return () => {
      ignore = true
    }
  }, [activeFilter, deferredQuery])

  useEffect(() => {
    let ignore = false

    async function loadApplications() {
      try {
        const applications = await fetchApplications({ limit: 50 })

        if (ignore) return
        setAppliedListingIds(
          new Set(
            applications
              .map((application) => application.listingId)
              .filter(Boolean),
          ),
        )
      } catch {
        if (!ignore) {
          setAppliedListingIds(new Set())
        }
      }
    }

    loadApplications()

    return () => {
      ignore = true
    }
  }, [])

  const handleApplicationCreated = (application) => {
    const appliedListingId = application?.listingId
    if (!appliedListingId) return

    setAppliedListingIds((current) => {
      const next = new Set(current)
      next.add(appliedListingId)
      return next
    })
  }

  const resolvedSelectedId = useMemo(() => {
    if (postings.length === 0) return null
    if (selectedId && postings.some((p) => getListingId(p) === selectedId)) {
      return selectedId
    }
    return getListingId(postings[0])
  }, [postings, selectedId])

  const selectedPosting =
    postings.find((p) => getListingId(p) === resolvedSelectedId) ?? null

  return (
    <div className="fcc-app">
      <TopNav
        searchPlaceholder="Search opportunities..."
        searchValue={searchValue}
        onSearchChange={(e) => setSearchValue(e.target.value)}
      />
      <WelcomeBanner />
      <EmailVerificationBanner />
      <div className="fcc-shell">
        <PostingList
          postings={postings}
          selectedId={resolvedSelectedId}
          onSelect={setSelectedId}
          activeFilter={activeFilter}
          onFilterChange={(id) => {
            setActiveFilter(id)
            setSelectedId(null)
          }}
        />
        <main className="fcc-main">
          {isLoading ? (
            <section className="fcc-detail fcc-detail--empty">
              <p>Loading opportunities...</p>
            </section>
          ) : errorMessage ? (
            <section className="fcc-detail fcc-detail--empty">
              <p>{errorMessage}</p>
            </section>
          ) : !selectedPosting ? (
            <section className="fcc-detail fcc-detail--empty">
              <p>No opportunities matched your current filters.</p>
            </section>
          ) : (
            <OpportunityDetail
              posting={selectedPosting}
              hasApplied={appliedListingIds.has(selectedPosting.listing_id)}
              onApplicationCreated={handleApplicationCreated}
            />
          )}
        </main>
      </div>
    </div>
  )
}
