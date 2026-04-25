import './ProfilePreviewModal.css'

function profileName(profile) {
  return profile?.fullName || profile?.full_name || 'Student profile'
}

function profileLookingFor(profile) {
  return profile?.lookingFor || profile?.looking_for || ''
}

function skillName(skill) {
  return skill.name || skill.skill_name || ''
}

function skillLevel(skill) {
  return skill.proficiencyLevel || skill.proficiency_level || ''
}

function courseCode(course) {
  return course.courseCode || course.course_code || ''
}

function courseName(course) {
  return course.courseName || course.course_name || ''
}

export default function ProfilePreviewModal({
  profile,
  onClose,
  closeLabel = 'Back',
}) {
  if (!profile) return null

  const name = profileName(profile)

  return (
    <div className="profile-preview-backdrop" role="presentation">
      <div
        className="profile-preview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-preview-title"
      >
        <div className="profile-preview__banner" />
        <div className="profile-preview__body">
          <div className="profile-preview__hero">
            <div className="profile-preview__avatar" aria-hidden>
              {name.slice(0, 1)}
            </div>
            <div className="profile-preview__info">
              <h2 id="profile-preview-title" className="profile-preview__name">
                {name}
              </h2>
              <p className="profile-preview__line">
                {[
                  profile.college,
                  profile.graduationYear
                    ? `Class of ${profile.graduationYear}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' • ') || 'Student profile'}
              </p>
              {profile.major ? (
                <p className="profile-preview__major">{profile.major}</p>
              ) : null}
            </div>
          </div>

          <section className="profile-preview__section">
            <h3>About</h3>
            <p>{profile.bio || 'No bio added yet.'}</p>
          </section>

          <section className="profile-preview__section">
            <h3>Looking for</h3>
            <p>{profileLookingFor(profile) || 'No preference added yet.'}</p>
          </section>

          <section className="profile-preview__section">
            <h3>Skills</h3>
            {profile.skills?.length ? (
              <div className="profile-preview__skills">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.userSkillId || skill.user_skill_id || skillName(skill)}
                    className="profile-preview__skill"
                  >
                    {skillName(skill)}
                    {skillLevel(skill) ? ` • ${skillLevel(skill)}` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <p>No skills added yet.</p>
            )}
          </section>

          <section className="profile-preview__section">
            <h3>Courses</h3>
            {profile.courses?.length ? (
              <div className="profile-preview__courses">
                {profile.courses.map((course) => (
                  <div
                    key={
                      course.userCourseId ||
                      course.user_course_id ||
                      `${courseCode(course)}-${course.institution}`
                    }
                    className="profile-preview__course"
                  >
                    <strong>{courseCode(course)}</strong>
                    <span>{courseName(course)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No courses added yet.</p>
            )}
          </section>

          <div className="profile-preview__actions">
            <button
              type="button"
              className="fcc-btn fcc-btn--primary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
