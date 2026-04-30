import test from "node:test";
import assert from "node:assert/strict";

import app from "../src/app.js";
import { query, testDatabaseConnection } from "../src/config/db.js";

const TEST_EMAIL = "stanley.test.auth@umass.edu";
const TEST_USERNAME = "stanley_test_auth";
const TEST_PASSWORD = "StanleyPass123!";
const DUPLICATE_LOCAL_PART = "shared.name";
const DUPLICATE_USERNAME = "shared.name";
const FIRST_DUPLICATE_EMAIL = `${DUPLICATE_LOCAL_PART}@umass.edu`;
const SECOND_DUPLICATE_EMAIL = `${DUPLICATE_LOCAL_PART}@hampshire.edu`;

let server;
let baseUrl;

async function requestJson(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();

  return {
    status: response.status,
    body: payload
  };
}

async function deleteTestUser() {
  await query("DELETE FROM users WHERE email = $1", [TEST_EMAIL]);
}

async function deleteUserByEmail(email) {
  await query("DELETE FROM users WHERE email = $1", [email]);
}

async function deleteVerificationTokensByEmail(email) {
  await query(
    `
      DELETE FROM email_verification_tokens
      WHERE user_id IN (
        SELECT user_id
        FROM users
        WHERE email = $1
      )
    `,
    [email]
  );
}

test.before(async () => {
  await testDatabaseConnection();

  server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  await deleteTestUser();
  await deleteVerificationTokensByEmail(TEST_EMAIL);
});

test.after(async () => {
  await deleteVerificationTokensByEmail(TEST_EMAIL);
  await deleteTestUser();
  await deleteVerificationTokensByEmail(FIRST_DUPLICATE_EMAIL);
  await deleteUserByEmail(FIRST_DUPLICATE_EMAIL);
  await deleteVerificationTokensByEmail(SECOND_DUPLICATE_EMAIL);
  await deleteUserByEmail(SECOND_DUPLICATE_EMAIL);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
});

test("GET /health returns service status", async () => {
  const response = await requestJson("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "five-college-connector-server");
});

test("POST /api/auth/signin signs in a seeded user", async () => {
  const response = await requestJson("/api/auth/signin", {
    method: "POST",
    body: {
      email: "emily.rodriguez@umass.edu",
      password: "DemoPass123!"
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Signed in successfully");
  assert.ok(response.body.authToken);
  assert.equal(response.body.user.email, "emily.rodriguez@umass.edu");
  assert.equal(response.body.profile.college, "UMass Amherst");
  assert.ok(Array.isArray(response.body.profile.skills));
  assert.ok(Array.isArray(response.body.profile.courses));
});

test("POST /api/auth/signin rejects an invalid password", async () => {
  const response = await requestJson("/api/auth/signin", {
    method: "POST",
    body: {
      email: "emily.rodriguez@umass.edu",
      password: "wrong-password"
    }
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Invalid email or password");
});

test("POST /api/auth/signup creates a user, profile, skills, and courses", async () => {
  await deleteTestUser();

  const response = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Stanley Test User",
        bio: "Created by API test",
        college: "UMass Amherst",
        major: "Computer Science",
        graduationYear: 2027,
        interests: "Testing, Backend",
        availability: "Weeknights",
        lookingFor: "projects",
        profileImageUrl: "",
        skills: [
          {
            name: "Testing",
            category: "Tools",
            proficiencyLevel: "intermediate",
            isOfferingHelp: true,
            isSeekingHelp: false
          }
        ],
        courses: [
          {
            courseCode: "COMPSCI 520",
            courseName: "Software Engineering",
            institution: "UMass Amherst",
            status: "in-progress",
            grade: ""
          }
        ]
      }
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Account created successfully");
  assert.equal(response.body.user.email, TEST_EMAIL);
  assert.equal(response.body.user.emailVerified, false);
  assert.equal(response.body.profile.fullName, "Stanley Test User");
  assert.equal(response.body.profile.skills.length, 1);
  assert.equal(response.body.profile.skills[0].userId, response.body.user.id);
  assert.equal(response.body.profile.courses.length, 1);
  assert.equal(response.body.profile.courses[0].userId, response.body.user.id);

  const savedUserResult = await query(
    "SELECT user_id, email, email_verified FROM users WHERE email = $1",
    [TEST_EMAIL]
  );
  const savedProfileResult = await query(
    "SELECT profile_id, user_id FROM profiles WHERE user_id = $1",
    [response.body.user.id]
  );
  const savedSkillLinkResult = await query(
    "SELECT user_id, profile_id FROM user_skills WHERE user_id = $1",
    [response.body.user.id]
  );
  const savedCourseLinkResult = await query(
    "SELECT user_id, profile_id FROM user_courses WHERE user_id = $1",
    [response.body.user.id]
  );
  const savedVerificationTokenResult = await query(
    "SELECT token_id FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL",
    [response.body.user.id]
  );

  assert.equal(savedUserResult.rowCount, 1);
  assert.equal(savedUserResult.rows[0].email_verified, false);
  assert.equal(savedProfileResult.rowCount, 1);
  assert.equal(savedSkillLinkResult.rowCount, 1);
  assert.equal(savedCourseLinkResult.rowCount, 1);
  assert.equal(savedVerificationTokenResult.rowCount, 1);
});

test("POST /api/auth/signup allows the same username when emails are different", async () => {
  await deleteUserByEmail(FIRST_DUPLICATE_EMAIL);
  await deleteUserByEmail(SECOND_DUPLICATE_EMAIL);

  const firstResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: FIRST_DUPLICATE_EMAIL,
      username: DUPLICATE_USERNAME,
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Shared Name One",
        bio: "",
        college: "UMass Amherst",
        major: "",
        graduationYear: 2027,
        interests: "",
        availability: "",
        lookingFor: "",
        profileImageUrl: "",
        skills: [],
        courses: []
      }
    }
  });

  const secondResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: SECOND_DUPLICATE_EMAIL,
      username: DUPLICATE_USERNAME,
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Shared Name Two",
        bio: "",
        college: "Hampshire College",
        major: "",
        graduationYear: 2028,
        interests: "",
        availability: "",
        lookingFor: "",
        profileImageUrl: "",
        skills: [],
        courses: []
      }
    }
  });

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(firstResponse.body.user.username, DUPLICATE_USERNAME);
  assert.equal(secondResponse.body.user.username, DUPLICATE_USERNAME);
  assert.equal(firstResponse.body.user.email, FIRST_DUPLICATE_EMAIL);
  assert.equal(secondResponse.body.user.email, SECOND_DUPLICATE_EMAIL);
});

test("GET /api/auth/verify-email marks a user's email as verified", async () => {
  await deleteVerificationTokensByEmail(TEST_EMAIL);
  await deleteTestUser();

  const signUpResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Stanley Test User",
        bio: "",
        college: "UMass Amherst",
        major: "Computer Science",
        graduationYear: 2027,
        interests: "",
        availability: "",
        lookingFor: "",
        profileImageUrl: "",
        skills: [],
        courses: []
      }
    }
  });

  assert.equal(signUpResponse.status, 201);

  const tokenResult = await query(
    "SELECT token FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL",
    [signUpResponse.body.user.id]
  );

  assert.equal(tokenResult.rowCount, 1);

  const verifyResponse = await requestJson(
    `/api/auth/verify-email?token=${encodeURIComponent(tokenResult.rows[0].token)}`
  );

  assert.equal(verifyResponse.status, 200);
  assert.equal(verifyResponse.body.message, "Email verified successfully");
  assert.equal(verifyResponse.body.user.emailVerified, true);

  const savedUserResult = await query(
    "SELECT email_verified FROM users WHERE user_id = $1",
    [signUpResponse.body.user.id]
  );

  assert.equal(savedUserResult.rows[0].email_verified, true);

  const reusedResponse = await requestJson(
    `/api/auth/verify-email?token=${encodeURIComponent(tokenResult.rows[0].token)}`
  );

  assert.equal(reusedResponse.status, 400);
  assert.equal(reusedResponse.body.message, "Verification token has already been used");
});

test("POST /api/auth/verify-email/resend rotates the active verification token", async () => {
  await deleteVerificationTokensByEmail(TEST_EMAIL);
  await deleteTestUser();

  const signUpResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Stanley Test User",
        bio: "",
        college: "UMass Amherst",
        major: "Computer Science",
        graduationYear: 2027,
        interests: "",
        availability: "",
        lookingFor: "",
        profileImageUrl: "",
        skills: [],
        courses: []
      }
    }
  });

  assert.equal(signUpResponse.status, 201);

  const firstTokenResult = await query(
    "SELECT token FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL",
    [signUpResponse.body.user.id]
  );

  assert.equal(firstTokenResult.rowCount, 1);

  const resendResponse = await requestJson("/api/auth/verify-email/resend", {
    method: "POST",
    token: signUpResponse.body.authToken
  });

  assert.equal(resendResponse.status, 200);
  assert.equal(resendResponse.body.message, "Verification email sent successfully");

  const activeTokenResult = await query(
    "SELECT token FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL",
    [signUpResponse.body.user.id]
  );
  const originalTokenState = await query(
    "SELECT used_at FROM email_verification_tokens WHERE token = $1",
    [firstTokenResult.rows[0].token]
  );

  assert.equal(activeTokenResult.rowCount, 1);
  assert.notEqual(activeTokenResult.rows[0].token, firstTokenResult.rows[0].token);
  assert.ok(originalTokenState.rows[0].used_at);
});
