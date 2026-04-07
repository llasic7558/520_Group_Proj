import { useMemo, useState } from 'react'
import { CATEGORY_IDS, getListingId, mockPostings } from '../../data/postings.js'
import { OpportunityDetail } from '../../components/opportunities/OpportunityDetail.jsx'
import { PostingList } from '../../components/opportunities/PostingList.jsx'
import { TopNav } from '../../components/opportunities/TopNav.jsx'
import './OpportunitiesPage.css'

// main feed: list on the left, detail on the right
export default function OpportunitiesPage() {
  const [activeFilter, setActiveFilter] = useState(CATEGORY_IDS.ALL)
  const [selectedId, setSelectedId] = useState(
    () => getListingId(mockPostings[0]) ?? null,
  )

  // only show postings that match the tutoring/project/etc chip
  const filtered = useMemo(() => {
    if (activeFilter === CATEGORY_IDS.ALL) return mockPostings
    return mockPostings.filter((p) => p.category === activeFilter)
  }, [activeFilter])

  // if you change filter and old selection is gone, fall back to first card
  const resolvedSelectedId = useMemo(() => {
    if (filtered.length === 0) return null
    if (selectedId && filtered.some((p) => getListingId(p) === selectedId)) {
      return selectedId
    }
    return getListingId(filtered[0])
  }, [filtered, selectedId])

  const selectedPosting =
    filtered.find((p) => getListingId(p) === resolvedSelectedId) ?? null

  return (
    <div className="fcc-app">
      <TopNav />
      <div className="fcc-shell">
        <PostingList
          postings={filtered}
          selectedId={resolvedSelectedId}
          onSelect={setSelectedId}
          activeFilter={activeFilter}
          onFilterChange={(id) => {
            setActiveFilter(id)
            setSelectedId(null)
          }}
        />
        <main className="fcc-main">
          <OpportunityDetail posting={selectedPosting} />
        </main>
      </div>
    </div>
  )
}
