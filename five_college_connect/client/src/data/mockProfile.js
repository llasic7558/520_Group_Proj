// fake user for the profile page — matches roughly what we'd get from user + profile joins

export const mockUser = {
  user_id: '550e8400-e29b-41d4-a716-446655440001',
  username: 'emilyrodriguez',
  email: 'emilyr@umass.edu',
  role: 'student',
  email_verified: true,
  teacher_badge: false,
}

// starter values for the profile form before you hit save
export const mockProfileSeed = {
  profile_id: '660e8400-e29b-41d4-a716-446655440002',
  user_id: mockUser.user_id,
  full_name: 'Emily Rodriguez',
  bio: 'Computer Science and Mathematics student passionate about building accessible web apps and mentoring peers. Previously TA for CS 187. Open to research, internships, and collaborative projects on campus.',
  college: 'UMass Amherst',
  major: 'Computer Science & Mathematics',
  graduation_year: 2025,
  interests: 'Machine learning, HCI, open source, campus hackathons',
  availability: 'Weekdays: 4:00 PM – 8:00 PM · Weekends: 10:00 AM – 4:00 PM',
  looking_for: 'Research assistant roles, peer tutoring collaborations, and full-stack project teammates.',
  profile_image_url: null,
}

// each row is kinda like user_skill in the db
export const mockUserSkills = [
  {
    user_skill_id: 'a1',
    skill_name: 'Java',
    proficiency_level: 'Expert',
    is_offering_help: true,
    is_seeking_help: false,
  },
  {
    user_skill_id: 'a2',
    skill_name: 'Python',
    proficiency_level: 'Advanced',
    is_offering_help: true,
    is_seeking_help: false,
  },
  {
    user_skill_id: 'a3',
    skill_name: 'React',
    proficiency_level: 'Advanced',
    is_offering_help: true,
    is_seeking_help: false,
  },
  {
    user_skill_id: 'a4',
    skill_name: 'Node.js',
    proficiency_level: 'Intermediate',
    is_offering_help: true,
    is_seeking_help: true,
  },
  {
    user_skill_id: 'a5',
    skill_name: 'SQL',
    proficiency_level: 'Advanced',
    is_offering_help: false,
    is_seeking_help: false,
  },
  {
    user_skill_id: 'a6',
    skill_name: 'Git',
    proficiency_level: 'Expert',
    is_offering_help: true,
    is_seeking_help: false,
  },
]

export const mockUserCourses = [
  { user_course_id: 'c1', course_code: 'CS 187', course_name: 'Data Structures', grade: 'A', status: 'completed' },
  { user_course_id: 'c2', course_code: 'CS 311', course_name: 'Algorithms', grade: 'A-', status: 'completed' },
  { user_course_id: 'c3', course_code: 'MATH 235', course_name: 'Linear Algebra', grade: 'B+', status: 'completed' },
  { user_course_id: 'c4', course_code: 'CS 320', course_name: 'Software Engineering', grade: 'A', status: 'completed' },
]

// not in the er diagram as its own table yet but whatever, portfolio stuff
export const mockProjects = [
  {
    project_id: 'p1',
    title: 'Campus Event Finder',
    description: 'Cross-campus events app prototype with personalized filters and club calendars.',
    image_url: null,
    tags: ['React Native', 'Firebase'],
  },
  {
    project_id: 'p2',
    title: 'Study Buddy Matcher',
    description: 'Skill-based matching for Five College study groups with email verification.',
    image_url: null,
    tags: ['React', 'Node.js'],
  },
]

export const mockProfileStats = {
  connection_count: 24,
  skill_count: 12,
  project_count: 8,
  application_count: 15,
}

export const mockContact = {
  email: 'emilyr@umass.edu',
  location: 'Amherst, MA',
  github_url: 'https://github.com/example',
}

export const mockRecentActivity = [
  { id: 'r1', message: 'Applied to Research Assistant position', occurred_at_label: '2h ago' },
  { id: 'r2', message: 'Joined Linear Algebra study group', occurred_at_label: '1d ago' },
  { id: 'r3', message: 'Updated skills on profile', occurred_at_label: '3d ago' },
]
