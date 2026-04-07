// fake listing data for the opportunities page — field names match our er diagram pretty close
// extra keys like location_short are just so the cards look ok until the api sends real stuff

export const CATEGORY_IDS = {
  ALL: 'all',
  TUTORING: 'tutoring',
  PROJECT: 'project',
  JOB: 'job',
  STUDY_GROUP: 'study_group',
}

export const CATEGORY_META = {
  [CATEGORY_IDS.TUTORING]: {
    id: CATEGORY_IDS.TUTORING,
    label: 'Tutoring',
    chipClass: 'chipTutoring',
  },
  [CATEGORY_IDS.PROJECT]: {
    id: CATEGORY_IDS.PROJECT,
    label: 'Project',
    chipClass: 'chipProject',
  },
  [CATEGORY_IDS.JOB]: {
    id: CATEGORY_IDS.JOB,
    label: 'Job',
    chipClass: 'chipJob',
  },
  [CATEGORY_IDS.STUDY_GROUP]: {
    id: CATEGORY_IDS.STUDY_GROUP,
    label: 'Study Group',
    chipClass: 'chipStudyGroup',
  },
}

// maps db contact_method values to friendly strings in the ui
export const CONTACT_METHOD_LABELS = {
  through_profile: 'Through platform messaging',
  profile: 'Through platform messaging',
  email: 'Email',
  phone: 'Phone',
}

export const LISTING_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
}

export const SKILL_REQUIREMENT_TYPE = {
  REQUIRED: 'required',
  PREFERRED: 'preferred',
}

// turns created_at iso string into a human "posted 2h ago" style label
export function listingPostedDisplayLabel(iso, fallbackLabel) {
  if (!iso) return fallbackLabel
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return fallbackLabel
    const now = new Date()
    // hours between now and created_at
    const diffH = Math.round((now - d) / 36e5)
    if (diffH < 1) return 'Posted less than an hour ago'
    if (diffH < 24) return `Posted ${diffH} hour${diffH === 1 ? '' : 's'} ago`
    const diffD = Math.round(diffH / 24)
    if (diffD < 14) return `Posted ${diffD} day${diffD === 1 ? '' : 's'} ago`
    return `Posted ${d.toLocaleDateString()}`
  } catch {
    return fallbackLabel
  }
}

// line under the name like "cs major • class of 2026"
function creatorProfileSubtitle(profile) {
  const year = profile.graduation_year ? `Class of ${profile.graduation_year}` : ''
  const parts = [profile.major, year].filter(Boolean)
  return parts.join(' • ')
}

export const mockPostings = [
  {
    listing_id: '11111111-1111-1111-1111-111111111111',
    created_by_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
    title: 'CS 187 Data Structures Tutor Needed',
    description:
      'Looking for a patient tutor to help with CS 187 concepts—especially recursion, linked lists, and Big-O. Weekly sessions through midterms preferred.',
    category: CATEGORY_IDS.TUTORING,
    contact_method: 'through_profile',
    contact_details: '',
    banner_image_url: null,
    custom_color: null,
    status: LISTING_STATUS.PUBLISHED,
    expiration_date: null,
    created_at: '2026-04-02T16:00:00.000Z',
    updated_at: '2026-04-02T16:00:00.000Z',
    listing_skills: [
      {
        listing_skill_id: 'ls-101',
        skill_name: 'Java',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-102',
        skill_name: 'Data Structures',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-103',
        skill_name: 'Algorithms',
        requirement_type: SKILL_REQUIREMENT_TYPE.PREFERRED,
      },
      {
        listing_skill_id: 'ls-104',
        skill_name: 'Recursion',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-105',
        skill_name: 'Linked Lists',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
    ],
    creator: {
      user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
      email_verified: true,
      teacher_badge: false,
      profile: {
        profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001',
        full_name: 'Sarah Johnson',
        college: 'UMass Amherst',
        major: 'Computer Science',
        graduation_year: 2027,
        bio: null,
      },
    },
    location_short: 'Du Bois Library, UMass Amherst',
    compensation_summary: '$20 per hour',
    preferred_availability: [
      'Weekdays: 4:00 PM - 8:00 PM',
      'Weekends: 10:00 AM - 6:00 PM',
    ],
    card_skill_labels: ['Java', 'Data Structures', 'CHEM 282'],
  },
  {
    listing_id: '22222222-2222-2222-2222-222222222222',
    created_by_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002',
    title: 'HCI Research Study — 1-hour interview',
    description:
      'We are running a short usability study for a campus events app. Participants complete a 45-minute session plus a 15-minute debrief.',
    category: CATEGORY_IDS.PROJECT,
    contact_method: 'email',
    contact_details: 'hci-lab@mtholyoke.edu',
    banner_image_url: null,
    custom_color: null,
    status: LISTING_STATUS.PUBLISHED,
    expiration_date: '2026-05-01',
    created_at: '2026-04-02T13:00:00.000Z',
    updated_at: '2026-04-02T13:30:00.000Z',
    listing_skills: [
      {
        listing_skill_id: 'ls-201',
        skill_name: 'User Research',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-202',
        skill_name: 'Accessibility',
        requirement_type: SKILL_REQUIREMENT_TYPE.PREFERRED,
      },
      {
        listing_skill_id: 'ls-203',
        skill_name: 'Survey methods',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
    ],
    creator: {
      user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002',
      email_verified: true,
      teacher_badge: false,
      profile: {
        profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002',
        full_name: 'Alex Rivera',
        college: 'Mount Holyoke College',
        major: 'Psychology & CS',
        graduation_year: 2026,
        bio: null,
      },
    },
    location_short: 'Skinner Hall (room TBD)',
    compensation_summary: '$15 gift card',
    preferred_availability: ['Mar 10–14: afternoons'],
    card_skill_labels: ['Research', 'HCI', 'Amherst'],
  },
  {
    listing_id: '33333333-3333-3333-3333-333333333333',
    created_by_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003',
    title: 'Study Group — Linear Algebra (MATH 235)',
    description:
      'Weekly problem-set reviews before Thursday deadlines. Bring your own questions—we rotate who leads each topic.',
    category: CATEGORY_IDS.STUDY_GROUP,
    contact_method: 'through_profile',
    contact_details: 'Group chat on platform after you join.',
    banner_image_url: null,
    custom_color: null,
    status: LISTING_STATUS.PUBLISHED,
    expiration_date: null,
    created_at: '2026-04-01T12:00:00.000Z',
    updated_at: '2026-04-01T12:00:00.000Z',
    listing_skills: [
      {
        listing_skill_id: 'ls-301',
        skill_name: 'Linear Algebra',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-302',
        skill_name: 'Proofs',
        requirement_type: SKILL_REQUIREMENT_TYPE.PREFERRED,
      },
      {
        listing_skill_id: 'ls-303',
        skill_name: 'MATLAB',
        requirement_type: SKILL_REQUIREMENT_TYPE.PREFERRED,
      },
    ],
    creator: {
      user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003',
      email_verified: false,
      teacher_badge: false,
      profile: {
        profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003',
        full_name: 'Jordan Lee',
        college: 'UMass Amherst',
        major: 'Mathematics',
        graduation_year: 2026,
        bio: null,
      },
    },
    location_short: 'Integrative Learning Center',
    compensation_summary: '6 members',
    preferred_availability: [
      'Wednesdays: 6:00 PM - 8:00 PM',
      'Sundays: 2:00 PM - 4:00 PM',
    ],
    card_skill_labels: ['MATH 235', 'Study', 'ILC'],
  },
  {
    listing_id: '44444444-4444-4444-4444-444444444444',
    created_by_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004',
    title: 'Frontend help on React lab portfolio',
    description:
      'Small paid gig: tighten up components, fix responsive layout bugs, and improve accessibility on a student portfolio site.',
    category: CATEGORY_IDS.JOB,
    contact_method: 'through_profile',
    contact_details: '',
    banner_image_url: null,
    custom_color: '#88302D',
    status: LISTING_STATUS.PUBLISHED,
    expiration_date: '2026-04-30',
    created_at: '2026-03-31T10:00:00.000Z',
    updated_at: '2026-04-02T09:00:00.000Z',
    listing_skills: [
      {
        listing_skill_id: 'ls-401',
        skill_name: 'React',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-402',
        skill_name: 'CSS',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-403',
        skill_name: 'Git',
        requirement_type: SKILL_REQUIREMENT_TYPE.REQUIRED,
      },
      {
        listing_skill_id: 'ls-404',
        skill_name: 'Accessibility',
        requirement_type: SKILL_REQUIREMENT_TYPE.PREFERRED,
      },
    ],
    creator: {
      user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004',
      email_verified: true,
      teacher_badge: false,
      profile: {
        profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004',
        full_name: 'Sam Nguyen',
        college: 'Hampshire College',
        major: 'Web development portfolio (Div II)',
        graduation_year: 2027,
        bio: null,
      },
    },
    location_short: 'Remote / Hampshire campus',
    compensation_summary: '$18 per hour',
    preferred_availability: ['Flexible — coordinate over chat'],
    card_skill_labels: ['React', 'CSS', 'Remote'],
  },
]

export function getListingId(listing) {
  // tiny helper so we dont typo listing_id everywhere
  return listing?.listing_id ?? null
}

export function contactMethodLabel(method) {
  // falls back to raw string if we add a new method and forget the map
  return CONTACT_METHOD_LABELS[method] ?? method ?? 'Contact via listing'
}

export function creatorSubtitle(listing) {
  const p = listing?.creator?.profile
  if (!p) return ''
  return creatorProfileSubtitle(p)
}
