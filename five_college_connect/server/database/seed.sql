BEGIN;

INSERT INTO users (user_id, username, email, password_hash, role, email_verified, teacher_badge, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'emily_r',   'emily.rodriguez@umass.edu',   '$argon2id$placeholder_hash_1', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000002', 'michael_c', 'michael.chen@umass.edu',      '$argon2id$placeholder_hash_2', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000003', 'sarah_j',   'sarah.johnson@umass.edu',     '$argon2id$placeholder_hash_3', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000004', 'dr_chen',   'chen.lab@umass.edu',          '$argon2id$placeholder_hash_4', 'professor', TRUE,  TRUE,  'active'),
  ('a1000000-0000-0000-0000-000000000005', 'alex_k',    'alex.kim@amherst.edu',        '$argon2id$placeholder_hash_5', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000006', 'priya_s',   'priya.sharma@smith.edu',      '$argon2id$placeholder_hash_6', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000007', 'james_w',   'james.wu@hampshire.edu',      '$argon2id$placeholder_hash_7', 'student',   TRUE,  FALSE, 'active'),
  ('a1000000-0000-0000-0000-000000000008', 'lisa_m',    'lisa.martinez@mtholyoke.edu', '$argon2id$placeholder_hash_8', 'student',   FALSE, FALSE, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES
  ('a1000000-0000-0000-0000-000000000008', 'tok_sample_abc123xyz', NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (profile_id, user_id, full_name, bio, college, major, graduation_year, interests, availability, looking_for, profile_image_url) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Emily Rodriguez', 'Passionate CS student focused on full-stack and ML. Looking for research collabs.',
   'UMass Amherst', 'Computer Science & Mathematics', 2025,
   'Machine Learning, Web Development, Data Science, Research',
   'Weekdays 4-8 PM, Weekends 10 AM-6 PM', 'research,projects,jobs', ''),

  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
   'Michael Chen', 'Math tutor with 2 years experience. Calculus I-III, Linear Algebra, Differential Equations.',
   'UMass Amherst', 'Mathematics', 2026,
   'Calculus, Linear Algebra, Tutoring',
   'Flexible, prefer evenings', 'tutoring', ''),

  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003',
   'Sarah Johnson', 'Sophomore CS student, love data structures. Looking for a tutor for CS 187.',
   'UMass Amherst', 'Computer Science', 2027,
   'Java, Data Structures, Algorithms',
   'Weekdays 4-8 PM, Weekends 10 AM-6 PM', 'tutoring', ''),

  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004',
   'Dr. Wei Chen', 'Biology professor running the Chen Lab. Seeking undergrad research assistants.',
   'UMass Amherst', 'Biology', NULL,
   'Research, Lab Work, Biology, Genetics',
   'M/W/F 10 AM-4 PM', 'research', ''),

  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005',
   'Alex Kim', 'Junior studying CS and Design. Building a sustainability app and need collaborators.',
   'Amherst College', 'Computer Science', 2026,
   'React, TypeScript, Frontend, Design',
   'Evenings and weekends', 'projects,jobs', ''),

  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006',
   'Priya Sharma', 'Chemistry major looking for an Organic Chemistry study group for CHEM 262.',
   'Smith College', 'Chemistry', 2027,
   'Organic Chemistry, Study Groups, Lab Work',
   'Weekends and Tuesday evenings', 'study_groups', ''),

  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007',
   'James Wu', 'Interdisciplinary student into UI/UX design. Looking for startup opportunities.',
   'Hampshire College', 'Media Arts & Design', 2026,
   'UI/UX, Figma, Design, Startups',
   'Flexible', 'jobs,projects', '')
ON CONFLICT DO NOTHING;

INSERT INTO courses (course_id, course_code, course_name, institution) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'CS 187',   'Data Structures',              'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000002', 'CS 220',   'Programming Methodology',      'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000003', 'CS 326',   'Web Programming',              'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000004', 'CS 345',   'Database Systems',             'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000005', 'CS 383',   'Artificial Intelligence',      'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000006', 'MATH 235', 'Linear Algebra',               'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000007', 'MATH 131', 'Calculus I',                   'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000008', 'MATH 132', 'Calculus II',                  'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000009', 'CHEM 262', 'Organic Chemistry II',         'Smith College'),
  ('c1000000-0000-0000-0000-000000000010', 'BIO 310',  'Genetics',                     'UMass Amherst'),
  ('c1000000-0000-0000-0000-000000000011', 'CS 220',   'Introduction to Programming',  'Amherst College')
ON CONFLICT DO NOTHING;

INSERT INTO skills (skill_id, name, category) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Java',             'Languages'),
  ('d1000000-0000-0000-0000-000000000002', 'Python',           'Languages'),
  ('d1000000-0000-0000-0000-000000000003', 'JavaScript',       'Languages'),
  ('d1000000-0000-0000-0000-000000000004', 'TypeScript',       'Languages'),
  ('d1000000-0000-0000-0000-000000000005', 'SQL',              'Languages'),
  ('d1000000-0000-0000-0000-000000000006', 'React',            'Frameworks'),
  ('d1000000-0000-0000-0000-000000000007', 'Node.js',          'Frameworks'),
  ('d1000000-0000-0000-0000-000000000008', 'Data Structures',  'CS Fundamentals'),
  ('d1000000-0000-0000-0000-000000000009', 'Algorithms',       'CS Fundamentals'),
  ('d1000000-0000-0000-0000-000000000010', 'Machine Learning', 'AI/ML'),
  ('d1000000-0000-0000-0000-000000000011', 'Calculus',         'Mathematics'),
  ('d1000000-0000-0000-0000-000000000012', 'Linear Algebra',   'Mathematics'),
  ('d1000000-0000-0000-0000-000000000013', 'Organic Chemistry','Sciences'),
  ('d1000000-0000-0000-0000-000000000014', 'Biology',          'Sciences'),
  ('d1000000-0000-0000-0000-000000000015', 'Figma',            'Design'),
  ('d1000000-0000-0000-0000-000000000016', 'UI/UX Design',     'Design'),
  ('d1000000-0000-0000-0000-000000000017', 'Git',              'Tools'),
  ('d1000000-0000-0000-0000-000000000018', 'Docker',           'Tools'),
  ('d1000000-0000-0000-0000-000000000019', 'Recursion',        'CS Fundamentals'),
  ('d1000000-0000-0000-0000-000000000020', 'Linked Lists',     'CS Fundamentals')
ON CONFLICT DO NOTHING;

INSERT INTO user_courses (user_id, profile_id, course_id, status, grade) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'completed',   'A-'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'completed',   'A-'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'completed',   'B+'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000008', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006', 'completed',   'A'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'in-progress', ''),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'completed',   'B+'),
  ('a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000009', 'in-progress', '')
ON CONFLICT DO NOTHING;

INSERT INTO user_skills (user_id, profile_id, skill_id, proficiency_level, is_offering_help, is_seeking_help) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'expert',       TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'expert',       TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006', 'advanced',     TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000007', 'advanced',     TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005', 'intermediate', TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000010', 'intermediate', FALSE, FALSE),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000011', 'expert',       TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000012', 'expert',       TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', 'beginner',     FALSE, TRUE),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000009', 'beginner',     FALSE, TRUE),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000019', 'beginner',     FALSE, TRUE),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000006', 'advanced',     TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000004', 'advanced',     TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000015', 'intermediate', TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000015', 'expert',       TRUE,  FALSE),
  ('a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000016', 'expert',       TRUE,  FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO listings (listing_id, created_by_user_id, title, description, category, contact_method, contact_details, status, expiration_date) VALUES
  ('e1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000003',
   'CS 187 Data Structures Tutor Needed',
   'Looking for help with Java, linked lists, recursion, and tree traversals. Prefer Du Bois Library sessions. $20/hr.',
   'tutoring', 'profile', '', 'open', NOW() + INTERVAL '30 days'),

  ('e1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000005',
   'React Developer for Sustainability App',
   'Building a campus sustainability tracker. Need a React/TypeScript dev. Remote-friendly, Five College students preferred.',
   'project', 'email', 'alex.kim@amherst.edu', 'open', NOW() + INTERVAL '21 days'),

  ('e1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000004',
   'Research Assistant - Biology Lab',
   'Undergraduate research position in the Chen Lab (Morrill Science Center). 10 hrs/week, $18/hr. Biology or biochem background preferred.',
   'job', 'email', 'chen.lab@umass.edu', 'open', NOW() + INTERVAL '14 days'),

  ('e1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'Calculus II Tutor Available',
   'Experienced math tutor offering Calc I-III, Linear Algebra. Flexible scheduling. $25/hr.',
   'tutoring', 'profile', '', 'open', NOW() + INTERVAL '60 days'),

  ('e1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000007',
   'UI/UX Designer for Student Startup',
   'EduFlow Team is building a study analytics app. Looking for a Figma-savvy designer to join as a co-founder. Remote.',
   'job', 'profile', '', 'open', NOW() + INTERVAL '45 days')
ON CONFLICT DO NOTHING;

INSERT INTO listing_skills (listing_id, skill_id, requirement_type) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'required'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', 'required'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000009', 'required'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000019', 'preferred'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000020', 'preferred'),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006', 'required'),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004', 'required'),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'preferred'),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000014', 'required'),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000015', 'required'),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000016', 'required')
ON CONFLICT DO NOTHING;

INSERT INTO applications (listing_id, applicant_user_id, message, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Hi Sarah! I got an A in CS 187 and have tutored before. Happy to meet at Du Bois.', 'pending'),
  ('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'Interested in the research role. I have experience with Python data pipelines.', 'pending'),
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007',
   'I can handle both frontend and design. Big fan of sustainability projects.', 'accepted')
ON CONFLICT DO NOTHING;

INSERT INTO study_groups (group_id, created_by_user_id, course_id, group_name, description, category, status) VALUES
  ('f1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000006',
   'c1000000-0000-0000-0000-000000000009',
   'Organic Chemistry Study Group',
   'Weekly CHEM 262 sessions at Du Bois Library. All levels welcome. 8 members currently.',
   'study', 'open'),

  ('f1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000001',
   'c1000000-0000-0000-0000-000000000005',
   'CS 383 AI Study Group',
   'Prep for CS 383 exams and problem sets. Focus on search algorithms and neural nets.',
   'study', 'open'),

  ('f1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000005',
   NULL,
   'Five College Hackathon Team',
   'Building projects for the spring hackathon. Open to all Five College students. React/Python focus.',
   'project', 'open')
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, user_id, member_role) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'owner'),
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'member'),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'owner'),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'member'),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'owner'),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'member'),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', 'member')
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, type, message, is_read) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'application',
   'Emily Rodriguez applied to your listing "CS 187 Data Structures Tutor Needed".', FALSE),
  ('a1000000-0000-0000-0000-000000000004', 'application',
   'Emily Rodriguez applied to your listing "Research Assistant - Biology Lab".', FALSE),
  ('a1000000-0000-0000-0000-000000000005', 'application',
   'James Wu applied to your listing "React Developer for Sustainability App".', TRUE),
  ('a1000000-0000-0000-0000-000000000001', 'system',
   'Welcome to Five College Connect! Complete your profile to get discovered.', TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
