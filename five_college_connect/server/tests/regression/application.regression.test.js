import test from "node:test";
import assert from "node:assert/strict";

import app from "../../src/app.js";
import { query, testDatabaseConnection } from "../../src/config/db.js";

const TEST_LISTING_ID = "e1000000-0000-0000-0000-000000000001";
const TEST_USER_ID = "a1000000-0000-0000-0000-000000000002";
const TEST_MESSAGE = "Integration test application";

let server;
let baseUrl;

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

test("POST /api/applications creates an application", async () => {
  const response = await requestJson("/api/applications", {
    method: "POST",
    body: {
      listingId: TEST_LISTING_ID,
      applicantUserId: TEST_USER_ID,
      message: TEST_MESSAGE
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Application created successfully");
  assert.equal(response.body.application.listingId, TEST_LISTING_ID);
});

test("GET /api/applications returns application items", async () => {
  const response = await requestJson("/api/applications?limit=5");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);
});

test("GET /api/applications/:applicationId returns one application", async () => {
  const created = await requestJson("/api/applications", {
    method: "POST",
    body: {
      listingId: TEST_LISTING_ID,
      applicantUserId: TEST_USER_ID,
      message: TEST_MESSAGE
    }
  });

  const response = await requestJson(`/api/applications/${created.body.application.applicationId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.application.message, TEST_MESSAGE);
});

test("PUT /api/applications/:applicationId updates an application", async () => {
  const created = await requestJson("/api/applications", {
    method: "POST",
    body: {
      listingId: TEST_LISTING_ID,
      applicantUserId: TEST_USER_ID,
      message: TEST_MESSAGE
    }
  });

  const response = await requestJson(
    `/api/applications/${created.body.application.applicationId}`,
    {
      method: "PUT",
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

test("DELETE /api/applications/:applicationId removes an application", async () => {
  const created = await requestJson("/api/applications", {
    method: "POST",
    body: {
      listingId: TEST_LISTING_ID,
      applicantUserId: TEST_USER_ID,
      message: TEST_MESSAGE
    }
  });

  const response = await requestJson(
    `/api/applications/${created.body.application.applicationId}`,
    {
      method: "DELETE"
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Application deleted successfully");
});
