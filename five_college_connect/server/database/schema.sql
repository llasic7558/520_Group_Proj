CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
  user_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  password_hash  TEXT        NOT NULL,
  role           TEXT        NOT NULL DEFAULT 'student',
  email_verified BOOLEAN     NOT NULL DEFAULT FALSE,
  teacher_badge  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         TEXT        NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS profiles (
  profile_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL DEFAULT '',
  bio               TEXT NOT NULL DEFAULT '',
  college           TEXT NOT NULL,
  major             TEXT NOT NULL DEFAULT '',
  graduation_year   INT,
  interests         TEXT NOT NULL DEFAULT '',
  availability      TEXT NOT NULL DEFAULT '',
  looking_for       TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS courses (
  course_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  UNIQUE (course_code, institution)
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name     TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS user_courses (
  user_course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(course_id)   ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT '',
  grade          TEXT NOT NULL DEFAULT '',
  UNIQUE (profile_id, course_id)
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_skill_id     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID    NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  profile_id        UUID    NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  skill_id          UUID    NOT NULL REFERENCES skills(skill_id)     ON DELETE CASCADE,
  proficiency_level TEXT    NOT NULL DEFAULT '',
  is_offering_help  BOOLEAN NOT NULL DEFAULT FALSE,
  is_seeking_help   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS listings (
  listing_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title              TEXT        NOT NULL,
  description        TEXT        NOT NULL DEFAULT '',
  category           TEXT        NOT NULL,
  contact_method     TEXT        NOT NULL DEFAULT '',
  contact_details    TEXT        NOT NULL DEFAULT '',
  banner_image_url   TEXT        NOT NULL DEFAULT '',
  custom_color       TEXT        NOT NULL DEFAULT '',
  status             TEXT        NOT NULL DEFAULT 'open',
  expiration_date    DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_skills (
  listing_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  skill_id         UUID NOT NULL REFERENCES skills(skill_id)     ON DELETE CASCADE,
  requirement_type TEXT NOT NULL DEFAULT 'required',
  UNIQUE (listing_id, skill_id)
);

CREATE TABLE IF NOT EXISTS listing_attachments (
  attachment_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID        NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  file_url      TEXT        NOT NULL,
  file_type     TEXT        NOT NULL DEFAULT '',
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  application_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID        NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  applicant_user_id UUID        NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  message           TEXT        NOT NULL DEFAULT '',
  status            TEXT        NOT NULL DEFAULT 'pending',
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_groups (
  group_id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID        REFERENCES users(user_id)    ON DELETE SET NULL,
  course_id          UUID        REFERENCES courses(course_id) ON DELETE SET NULL,
  group_name         TEXT        NOT NULL,
  description        TEXT        NOT NULL DEFAULT '',
  category           TEXT        NOT NULL DEFAULT '',
  status             TEXT        NOT NULL DEFAULT 'open',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_member_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID        NOT NULL REFERENCES study_groups(group_id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(user_id)         ON DELETE CASCADE,
  member_role     TEXT        NOT NULL DEFAULT 'member',
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username         ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status           ON users(status);

CREATE INDEX IF NOT EXISTS idx_evt_user_id            ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_evt_token              ON email_verification_tokens(token);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id       ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_college       ON profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for   ON profiles(looking_for);

CREATE INDEX IF NOT EXISTS idx_courses_code_inst      ON courses(course_code, institution);
CREATE INDEX IF NOT EXISTS idx_skills_name_cat        ON skills(name, category);
CREATE INDEX IF NOT EXISTS idx_skills_category        ON skills(category);

CREATE INDEX IF NOT EXISTS idx_user_courses_user      ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_profile   ON user_courses(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course    ON user_courses(course_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user       ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_profile    ON user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill      ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_offering   ON user_skills(is_offering_help) WHERE is_offering_help = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_creator       ON listings(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category      ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status        ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_expiration    ON listings(expiration_date);
CREATE INDEX IF NOT EXISTS idx_listings_browse        ON listings(status, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm    ON listings USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listing_skills_listing ON listing_skills(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_skills_skill   ON listing_skills(skill_id);

CREATE INDEX IF NOT EXISTS idx_attachments_listing    ON listing_attachments(listing_id);

CREATE INDEX IF NOT EXISTS idx_applications_listing   ON applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status    ON applications(status);

CREATE INDEX IF NOT EXISTS idx_groups_course          ON study_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_groups_status          ON study_groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_category        ON study_groups(category);

CREATE INDEX IF NOT EXISTS idx_group_members_user     ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group    ON group_members(group_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread   ON notifications(user_id, is_read) WHERE is_read = FALSE;
