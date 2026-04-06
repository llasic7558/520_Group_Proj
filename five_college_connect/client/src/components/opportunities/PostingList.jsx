import {
  CATEGORY_IDS,
  CATEGORY_META,
  getListingId,
  listingPostedDisplayLabel,
} from '../../data/postings.js'
import { IconClock, IconPay, IconPin } from './Icons.jsx'

// chips at top of sidebar for filtering mock listings
const FILTER_CHIPS = [
  { id: CATEGORY_IDS.ALL, label: 'All' },
  { id: CATEGORY_IDS.TUTORING, label: 'Tutoring' },
  { id: CATEGORY_IDS.PROJECT, label: 'Projects' },
  { id: CATEGORY_IDS.JOB, label: 'Jobs' },
  { id: CATEGORY_IDS.STUDY_GROUP, label: 'Study Groups' },
]

// maps category string to css modifier for the colored pill
function categoryChipClass(category) {
  return CATEGORY_META[category]?.chipClass ?? 'chipTutoring'
}

// short location for the card so it doesnt wrap forever
function cardLocationLine(listing) {
  const loc = listing.location_short || ''
  const part = loc.split(',')[0]
  return part || loc || '—'
}

export function PostingList({
  postings,
  selectedId,
  onSelect,
  activeFilter,
  onFilterChange,
}) {
  // left column on opportunities page
  return (
    <aside className="fcc-sidebar" aria-label="Opportunities list">
      <div className="fcc-sidebar__header">
        <h1 className="fcc-sidebar__title">Opportunities</h1>
      </div>

      <div
        className="fcc-filter-chips"
        role="tablist"
        aria-label="Category filters"
      >
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === chip.id}
            className={
              activeFilter === chip.id
                ? 'fcc-chip fcc-chip--active'
                : 'fcc-chip'
            }
            onClick={() => onFilterChange(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <ul className="fcc-post-list">
        {postings.map((post) => {
          const lid = getListingId(post)
          const selected = lid === selectedId
          const profile = post.creator?.profile
          // turns iso date into "posted x ago" style string
          const posted = listingPostedDisplayLabel(post.created_at, 'Recently')
          return (
            <li key={lid}>
              <button
                type="button"
                className={
                  selected ? 'fcc-post-card fcc-post-card--selected' : 'fcc-post-card'
                }
                onClick={() => onSelect(lid)}
              >
                <div className="fcc-post-card__row">
                  <span className="fcc-post-card__title">{post.title}</span>
                  <span
                    className={`fcc-category-tag fcc-category-tag--${categoryChipClass(post.category)}`}
                  >
                    {CATEGORY_META[post.category].label}
                  </span>
                </div>
                <p className="fcc-post-card__poster">
                  {profile?.full_name} • {profile?.college}
                </p>
                <div className="fcc-post-card__meta">
                  <span className="fcc-meta-item">
                    <IconPin />
                    {cardLocationLine(post)}
                  </span>
                  <span className="fcc-meta-item">
                    <IconPay />
                    {post.compensation_summary ?? '—'}
                  </span>
                  <span className="fcc-meta-item">
                    <IconClock />
                    {/* strip "posted " because the icon already implies it */}
                    {posted.replace(/^Posted /, '')}
                  </span>
                </div>
                <div className="fcc-post-card__tags">
                  {(post.card_skill_labels ?? []).map((tag) => (
                    <span key={tag} className="fcc-mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
