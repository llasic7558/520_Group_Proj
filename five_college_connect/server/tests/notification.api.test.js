import test from "node:test";
import assert from "node:assert/strict";

import app from "../src/app.js";
import { query, testDatabaseConnection } from "../src/config/db.js";

const TEST_MESSAGE = "API notification test application";
const OWNER_LISTING_TITLE = "API Notification Owner Listing";
const SELF_LISTING_TITLE = "API Notification Self Listing";
const SEEDED_PASSWORD = "DemoPass123!";
const APPLICANT_EMAIL = "emily.rodriguez@umass.edu";
const LISTING_OWNER_EMAIL = "sarah.johnson@umass.edu";
const OTHER_USER_EMAIL = "michael.chen@umass.edu";

let server;
let baseUrl;
let applicantToken;
let listingOwnerToken;
let otherUserToken;
let ownerListingId;

function isOwnerListingNotification(item) {
  return item.message.includes(`"${OWNER_LISTING_TITLE}"`);
}

async function listOwnerListingNotifications({ unreadOnly = false } = {}) {
  const searchParams = new URLSearchParams({
    limit: "50"
  });

  if (unreadOnly) {
    searchParams.set("unreadOnly", "true");
  }

  const response = await requestJson(`/api/notifications?${searchParams.toString()}`, {
    token: listingOwnerToken
  });

  assert.equal(response.status, 200);

  return response.body.items.filter(isOwnerListingNotification);
}

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

async function deleteTestNotifications() {
  await query(
    `
      DELETE FROM notifications
      WHERE message LIKE $1
         OR message LIKE $2
    `,
    [`%${OWNER_LISTING_TITLE}%`, `%${SELF_LISTING_TITLE}%`]
  );
}

async function deleteTestApplications() {
  await query("DELETE FROM applications WHERE message = $1", [TEST_MESSAGE]);
}

async function deleteOwnerListing() {
  await query("DELETE FROM listings WHERE title = $1", [OWNER_LISTING_TITLE]);
}

async function deleteSelfListing() {
  await query("DELETE FROM listings WHERE title = $1", [SELF_LISTING_TITLE]);
}

async function createTestApplication() {
  const response = await requestJson("/api/applications", {
    method: "POST",
    token: applicantToken,
    body: {
      listingId: ownerListingId,
      message: TEST_MESSAGE
    }
  });

  assert.equal(response.status, 201);

  return response.body.application;
}

async function createOwnerListing() {
  const response = await requestJson("/api/listings", {
    method: "POST",
    token: listingOwnerToken,
    body: {
      title: OWNER_LISTING_TITLE,
      description: "Created by API notification test",
      category: "Tutoring",
      contactMethod: "email",
      contactDetails: "owner@umass.edu",
      customColor: "#112233",
      skills: [],
      attachments: []
    }
  });

  assert.equal(response.status, 201);

  return response.body.listing;
}

async function createSelfOwnedListing() {
  const response = await requestJson("/api/listings", {
    method: "POST",
    token: applicantToken,
    body: {
      title: SELF_LISTING_TITLE,
      description: "Created by API notification test",
      category: "Projects",
      contactMethod: "email",
      contactDetails: "owner@umass.edu",
      customColor: "#445566",
      skills: [],
      attachments: []
    }
  });

  assert.equal(response.status, 201);

  return response.body.listing;
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
  await deleteTestNotifications();
  await deleteOwnerListing();
  await deleteSelfListing();

  applicantToken = await signIn(APPLICANT_EMAIL, SEEDED_PASSWORD);
  listingOwnerToken = await signIn(LISTING_OWNER_EMAIL, SEEDED_PASSWORD);
  otherUserToken = await signIn(OTHER_USER_EMAIL, SEEDED_PASSWORD);

  const ownerListing = await createOwnerListing();
  ownerListingId = ownerListing.listingId;
});

test.after(async () => {
  await deleteTestApplications();
  await deleteTestNotifications();
  await deleteOwnerListing();
  await deleteSelfListing();

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

test.beforeEach(async () => {
  await deleteTestApplications();
  await deleteTestNotifications();
  await deleteSelfListing();
});

test("GET /api/notifications requires authentication", { concurrency: false }, async () => {
  const response = await requestJson("/api/notifications");

  assert.equal(response.status, 401);
});

test("POST /api/applications creates an unread notification for the listing owner", { concurrency: false }, async () => {
  await createTestApplication();

  const notifications = await listOwnerListingNotifications({ unreadOnly: true });

  assert.ok(notifications.length >= 1);
  assert.equal(notifications[0].type, "new_application");
  assert.match(notifications[0].message, /Someone applied to your listing/);
  assert.equal(notifications[0].isRead, false);
});

test("GET /api/notifications updates unreadCount when a new notification is created", { concurrency: false }, async () => {
  const beforeNotifications = await listOwnerListingNotifications({ unreadOnly: true });

  await createTestApplication();

  const afterNotifications = await listOwnerListingNotifications({ unreadOnly: true });

  assert.equal(afterNotifications.length, beforeNotifications.length + 1);
});

test("GET /api/notifications supports unread-only filtering", { concurrency: false }, async () => {
  await createTestApplication();

  const response = await requestJson("/api/notifications?unreadOnly=true&limit=10", {
    token: listingOwnerToken
  });

  assert.equal(response.status, 200);
  assert.ok(response.body.items.length >= 1);
  assert.ok(response.body.items.every((item) => item.isRead === false));
});

test("PATCH /api/notifications/:notificationId/read marks one notification as read", { concurrency: false }, async () => {
  await createTestApplication();

  const notifications = await listOwnerListingNotifications({ unreadOnly: true });
  const notificationId = notifications[0].notificationId;

  const readResponse = await requestJson(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    token: listingOwnerToken
  });

  assert.equal(readResponse.status, 200);
  assert.equal(readResponse.body.notification.notificationId, notificationId);
  assert.equal(readResponse.body.notification.isRead, true);
});

test("PATCH /api/notifications/:notificationId/read decreases unreadCount by one", { concurrency: false }, async () => {
  await createTestApplication();

  const beforeNotifications = await listOwnerListingNotifications({ unreadOnly: true });
  const notificationId = beforeNotifications[0].notificationId;

  const readResponse = await requestJson(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    token: listingOwnerToken
  });
  const afterNotifications = await listOwnerListingNotifications({ unreadOnly: true });

  assert.equal(readResponse.status, 200);
  assert.equal(afterNotifications.length, beforeNotifications.length - 1);
});

test("PATCH /api/notifications/:notificationId/read rejects another user's notification", { concurrency: false }, async () => {
  await createTestApplication();

  const notifications = await listOwnerListingNotifications({ unreadOnly: true });
  const notificationId = notifications[0].notificationId;

  const response = await requestJson(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    token: otherUserToken
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Notification not found");
});

test("PATCH /api/notifications/:notificationId/read returns 404 for a missing notification", { concurrency: false }, async () => {
  const response = await requestJson(
    "/api/notifications/00000000-0000-0000-0000-000000000000/read",
    {
      method: "PATCH",
      token: listingOwnerToken
    }
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Notification not found");
});

test("PATCH /api/notifications/read-all marks all notifications as read", { concurrency: false }, async () => {
  await createTestApplication();
  await createTestApplication();

  const markAllResponse = await requestJson("/api/notifications/read-all", {
    method: "PATCH",
    token: listingOwnerToken
  });

  assert.equal(markAllResponse.status, 200);
  assert.ok(markAllResponse.body.updatedCount >= 1);

  const unreadNotifications = await listOwnerListingNotifications({ unreadOnly: true });

  assert.equal(unreadNotifications.length, 0);
});

test("POST /api/applications does not create a notification for a self-owned listing", { concurrency: false }, async () => {
  const selfListing = await createSelfOwnedListing();

  const beforeResponse = await requestJson("/api/notifications", {
    token: applicantToken
  });

  const applicationResponse = await requestJson("/api/applications", {
    method: "POST",
    token: applicantToken,
    body: {
      listingId: selfListing.listingId,
      message: TEST_MESSAGE
    }
  });
  const afterResponse = await requestJson("/api/notifications", {
    token: applicantToken
  });

  assert.equal(applicationResponse.status, 201);
  assert.equal(beforeResponse.status, 200);
  assert.equal(afterResponse.status, 200);
  assert.equal(afterResponse.body.unreadCount, beforeResponse.body.unreadCount);
});
