CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Stanley drafted the backend around the current expected schema, but after Parthav
-- creates the final schema, Stanley can update the repositories and service layer to match it

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  teacher_badge BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL,
  major TEXT NOT NULL DEFAULT '',
  graduation_year INT,
  interests TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '',
  looking_for TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS skills (
  skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS courses (
  course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  UNIQUE (course_code, institution)
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT '',
  is_offering_help BOOLEAN NOT NULL DEFAULT FALSE,
  is_seeking_help BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_courses (
  user_course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_name_category ON skills(name, category);
CREATE INDEX IF NOT EXISTS idx_courses_code_institution ON courses(course_code, institution);
CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_profile_id ON user_courses(profile_id);
