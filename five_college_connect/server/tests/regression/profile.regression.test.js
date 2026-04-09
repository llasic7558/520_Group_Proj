import test from "node:test";
import assert from "node:assert/strict";

import app from "../../src/app.js";
import { query, testDatabaseConnection } from "../../src/config/db.js";

const TEST_EMAIL = "stanley.profile.test@umass.edu";
const TEST_PASSWORD = "StanleyProfile123!";

let server;
let baseUrl;
let testUserId;

async function requestJson(path, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
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

test.before(async () => {
  await testDatabaseConnection();

  server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  await deleteTestUser();

  const signupResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      username: "stanley_profile_test",
      password: TEST_PASSWORD,
      role: "student",
      profile: {
        fullName: "Stanley Profile Test",
        bio: "",
        college: "UMass Amherst",
        major: "",
        graduationYear: null,
        interests: "",
        availability: "",
        lookingFor: "",
        profileImageUrl: "",
        skills: [],
        courses: []
      }
    }
  });

  testUserId = signupResponse.body.user.id;
});

test.after(async () => {
  await deleteTestUser();

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

test("GET /api/profiles/:userId returns the full profile", async () => {
  const response = await requestJson(`/api/profiles/${testUserId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.profile.userId, testUserId);
  assert.ok(Array.isArray(response.body.profile.skills));
  assert.ok(Array.isArray(response.body.profile.courses));
});

test("PUT /api/profiles/:userId updates profile fields and relationships", async () => {
  const response = await requestJson(`/api/profiles/${testUserId}`, {
    method: "PUT",
    body: {
      fullName: "Stanley Profile Test",
      bio: "Updated by integration test",
      college: "UMass Amherst",
      major: "Computer Science",
      graduationYear: 2027,
      interests: "AI, Backend",
      availability: "Weekends",
      lookingFor: "projects",
      profileImageUrl: "",
      skills: [
        {
          name: "Python",
          category: "Languages",
          proficiencyLevel: "expert",
          isOfferingHelp: true,
          isSeekingHelp: false
        }
      ],
      courses: [
        {
          courseCode: "CS 383",
          courseName: "Artificial Intelligence",
          institution: "UMass Amherst",
          status: "completed",
          grade: "A"
        }
      ]
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Profile updated successfully");
  assert.equal(response.body.profile.bio, "Updated by integration test");
  assert.equal(response.body.profile.skills.length, 1);
  assert.equal(response.body.profile.skills[0].name, "Python");
  assert.equal(response.body.profile.courses.length, 1);
  assert.equal(response.body.profile.courses[0].courseCode, "CS 383");
});
