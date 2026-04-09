import test from "node:test";
import assert from "node:assert/strict";

import app from "../src/app.js";
import { query, testDatabaseConnection } from "../src/config/db.js";

const TEST_LISTING_ID = "e1000000-0000-0000-0000-000000000001";
const TEST_MESSAGE = "Integration test application";
const SEEDED_PASSWORD = "DemoPass123!";
const APPLICANT_EMAIL = "emily.rodriguez@umass.edu";
const LISTING_OWNER_EMAIL = "sarah.johnson@umass.edu";
const OTHER_USER_EMAIL = "michael.chen@umass.edu";

let server;
let baseUrl;
let applicantToken;
let listingOwnerToken;
let otherUserToken;

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

async function signIn(email, password) {
  const response = await requestJson("/api/auth/signin", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  assert.equal(response.status, 200);

  return response.body.authToken;
}

async function createTestApplication(token = applicantToken, message = TEST_MESSAGE) {
  return requestJson("/api/applications", {
    method: "POST",
    token,
    body: {
      listingId: TEST_LISTING_ID,
      message
    }
  });
}

async function deleteTestApplications() {
  await query("DELETE FROM applications WHERE message = $1", [TEST_MESSAGE]);
  await query("DELETE FROM applications WHERE message = $1", [`${TEST_MESSAGE} updated`]);
}

test.before(async () => {
  await testDatabaseConnection();

  server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  await deleteTestApplications();
  applicantToken = await signIn(APPLICANT_EMAIL, SEEDED_PASSWORD);
  listingOwnerToken = await signIn(LISTING_OWNER_EMAIL, SEEDED_PASSWORD);
  otherUserToken = await signIn(OTHER_USER_EMAIL, SEEDED_PASSWORD);
});

test.after(async () => {
  await deleteTestApplications();

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

test("POST /api/applications requires authentication", async () => {
  const response = await requestJson("/api/applications", {
    method: "POST",
    body: {
      listingId: TEST_LISTING_ID,
      message: TEST_MESSAGE
    }
  });

  assert.equal(response.status, 401);
});

test("POST /api/applications creates an application", async () => {
  const response = await createTestApplication();

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Application created successfully");
  assert.equal(response.body.application.listingId, TEST_LISTING_ID);
});

test("GET /api/applications returns application items", async () => {
  const response = await requestJson("/api/applications?limit=5", {
    token: applicantToken
  });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);
});

test("GET /api/applications supports listing-owner views", async () => {
  const response = await requestJson(`/api/applications?listingId=${TEST_LISTING_ID}`, {
    token: listingOwnerToken
  });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);
});

test("GET /api/applications/:applicationId returns one application", async () => {
  const created = await createTestApplication();

  const response = await requestJson(`/api/applications/${created.body.application.applicationId}`, {
    token: applicantToken
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.application.message, TEST_MESSAGE);
});

test("PUT /api/applications/:applicationId updates an application", async () => {
  const created = await createTestApplication();

  const response = await requestJson(
    `/api/applications/${created.body.application.applicationId}`,
    {
      method: "PUT",
      token: applicantToken,
      body: {
        message: `${TEST_MESSAGE} updated`,
        status: "accepted"
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.application.status, "accepted");
  assert.equal(response.body.application.message, `${TEST_MESSAGE} updated`);
});

test("PUT /api/applications/:applicationId rejects updates from a different user", async () => {
  const created = await createTestApplication();

  const response = await requestJson(
    `/api/applications/${created.body.application.applicationId}`,
    {
      method: "PUT",
      token: otherUserToken,
      body: {
        message: "Should fail",
        status: "accepted"
      }
    }
  );

  assert.equal(response.status, 403);
});

test("DELETE /api/applications/:applicationId removes an application", async () => {
  const created = await createTestApplication();

  const response = await requestJson(
    `/api/applications/${created.body.application.applicationId}`,
    {
      method: "DELETE",
      token: applicantToken
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Application deleted successfully");
});
