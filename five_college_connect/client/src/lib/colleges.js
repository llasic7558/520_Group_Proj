// Maps the email domain of a Five Colleges email address to the display
// name the backend stores in profiles.college
// The signup form only asks the user for an email and password, and gives defaults for everything else 
const COLLEGE_BY_DOMAIN = {
  'umass.edu': 'UMass Amherst',
  'amherst.edu': 'Amherst College',
  'smith.edu': 'Smith College',
  'hampshire.edu': 'Hampshire College',
  'mtholyoke.edu': 'Mount Holyoke College',
}

export function collegeFromEmailDomain(email) {
  if (typeof email !== 'string') return 'Unknown'
  const at = email.lastIndexOf('@')
  if (at === -1) return 'Unknown'
  const domain = email.slice(at + 1).toLowerCase().trim()
  return COLLEGE_BY_DOMAIN[domain] || 'Unknown'
}
