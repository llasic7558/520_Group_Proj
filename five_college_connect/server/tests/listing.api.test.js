import test from "node:test";
import assert from "node:assert/strict";

import app from "../src/app.js";
import { query, testDatabaseConnection } from "../src/config/db.js";

const TEST_TITLE = "API Test Listing";
const TEST_TITLE_GET = "API Test Listing Get";
const TEST_TITLE_UPDATE = "API Test Listing Update";
const TEST_TITLE_DELETE = "API Test Listing Delete";
const TEST_TITLE_PERMANENT_DELETE = "API Test Listing Permanent Delete";
const TEST_APPLICATION_MESSAGE = "API Test Listing Permanent Delete Application";
const SEEDED_PASSWORD = "DemoPass123!";
const OWNER_EMAIL = "emily.rodriguez@umass.edu";
const OTHER_USER_EMAIL = "michael.chen@umass.edu";
const UNVERIFIED_EMAIL = "listing.unverified@umass.edu";
const UNVERIFIED_USERNAME = "listing_unverified";
const UNVERIFIED_PASSWORD = "StanleyPass123!";

let server;
let baseUrl;
let ownerToken;
let otherUserToken;
let ownerUserId;
let otherUserId;

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

async function getUserIdByEmail(email) {
  const result = await query("SELECT user_id FROM users WHERE email = $1", [email]);
  return result.rows[0]?.user_id || null;
}

async function deleteTestListings() {
  await query("DELETE FROM listings WHERE title LIKE $1", ["API Test Listing%"]);
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

async function createTestListing(title = TEST_TITLE, token = ownerToken) {
  return requestJson("/api/listings", {
    method: "POST",
    token,
    body: {
      title,
      description: "Created by API test",
      category: "project",
      contactMethod: "email",
      contactDetails: "test@umass.edu",
      customColor: "#123456",
      skills: [
        {
          name: "React",
          category: "Frameworks",
          requirementType: "required"
        }
      ],
      attachments: [
        {
          fileUrl: "https://example.com/test.png",
          fileType: "image/png"
        }
      ]
    }
  });
}

test.before(async () => {
  await testDatabaseConnection();

  server = app.listen(0);

  await new Promise((resolve) => {
    server.once("listening", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  await deleteTestListings();
  await deleteVerificationTokensByEmail(UNVERIFIED_EMAIL);
  await deleteUserByEmail(UNVERIFIED_EMAIL);
  ownerToken = await signIn(OWNER_EMAIL, SEEDED_PASSWORD);
  otherUserToken = await signIn(OTHER_USER_EMAIL, SEEDED_PASSWORD);
  ownerUserId = await getUserIdByEmail(OWNER_EMAIL);
  otherUserId = await getUserIdByEmail(OTHER_USER_EMAIL);
});

test.after(async () => {
  await deleteTestListings();
  await deleteVerificationTokensByEmail(UNVERIFIED_EMAIL);
  await deleteUserByEmail(UNVERIFIED_EMAIL);

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

test("POST /api/listings requires authentication", async () => {
  const response = await requestJson("/api/listings", {
    method: "POST",
    body: {
      title: TEST_TITLE,
      category: "project"
    }
  });

  assert.equal(response.status, 401);
});

test("POST /api/listings creates a listing with skills and attachments", async () => {
  const response = await createTestListing(TEST_TITLE);

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Listing created successfully");
  assert.equal(response.body.listing.title, TEST_TITLE);
  assert.equal(response.body.listing.skills.length, 1);
  assert.equal(response.body.listing.attachments.length, 1);
});

test("POST /api/listings rejects users whose email is not verified", async () => {
  const signUpResponse = await requestJson("/api/auth/signup", {
    method: "POST",
    body: {
      email: UNVERIFIED_EMAIL,
      username: UNVERIFIED_USERNAME,
      password: UNVERIFIED_PASSWORD,
      role: "student",
      profile: {
        fullName: "Unverified Listing User",
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
  assert.equal(signUpResponse.body.user.emailVerified, false);

  const response = await createTestListing("API Test Listing Unverified", signUpResponse.body.authToken);

  assert.equal(response.status, 403);
  assert.equal(response.body.message, "Email verification required");
  assert.equal(response.body.details.code, "EMAIL_NOT_VERIFIED");
});

test("GET /api/listings returns listing items", async () => {
  const response = await requestJson("/api/listings?limit=5");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);
  assert.ok(response.body.items[0].creator);
  assert.ok(response.body.items[0].creator.profile);
});

test("GET /api/listings supports filtering by createdByUserId", async () => {
  await createTestListing(`${TEST_TITLE} Owner Filter`, ownerToken);
  await createTestListing(`${TEST_TITLE} Other Filter`, otherUserToken);

  const ownerResponse = await requestJson(
    `/api/listings?createdByUserId=${ownerUserId}&limit=10`
  );
  const otherResponse = await requestJson(
    `/api/listings?createdByUserId=${otherUserId}&limit=10`
  );

  assert.equal(ownerResponse.status, 200);
  assert.equal(otherResponse.status, 200);
  assert.ok(ownerResponse.body.items.length >= 1);
  assert.ok(otherResponse.body.items.length >= 1);
  assert.ok(
    ownerResponse.body.items.every((item) => item.createdByUserId === ownerUserId)
  );
  assert.ok(
    otherResponse.body.items.every((item) => item.createdByUserId === otherUserId)
  );
});

test("GET /api/listings/:listingId returns one listing", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_GET);
  const listingId = createdResponse.body.listing.listingId;

  const response = await requestJson(`/api/listings/${listingId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.listing.listingId, listingId);
  assert.equal(response.body.listing.title, TEST_TITLE_GET);
  assert.equal(response.body.listing.skills.length, 1);
  assert.equal(response.body.listing.attachments.length, 1);
  assert.ok(response.body.listing.creator);
  assert.ok(response.body.listing.creator.profile);
});

test("PUT /api/listings/:listingId updates listing fields and related rows", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_UPDATE);
  const listingId = createdResponse.body.listing.listingId;

  const response = await requestJson(`/api/listings/${listingId}`, {
    method: "PUT",
    token: ownerToken,
    body: {
      title: `${TEST_TITLE_UPDATE} Edited`,
      description: "Updated by API test",
      category: "job",
      contactMethod: "profile",
      contactDetails: "",
      bannerImageUrl: "https://example.com/banner.png",
      customColor: "#abcdef",
      status: "closed",
      expirationDate: "2026-12-31",
      skills: [
        {
          name: "Node.js",
          category: "Frameworks",
          requirementType: "preferred"
        }
      ],
      attachments: [
        {
          fileUrl: "https://example.com/updated.pdf",
          fileType: "application/pdf"
        }
      ]
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Listing updated successfully");
  assert.equal(response.body.listing.title, `${TEST_TITLE_UPDATE} Edited`);
  assert.equal(response.body.listing.category, "job");
  assert.equal(response.body.listing.status, "closed");
  assert.equal(response.body.listing.skills.length, 1);
  assert.equal(response.body.listing.skills[0].name, "Node.js");
  assert.equal(response.body.listing.attachments.length, 1);
  assert.equal(response.body.listing.attachments[0].fileType, "application/pdf");
});

test("PUT /api/listings/:listingId rejects updates from a different user", async () => {
  const createdResponse = await createTestListing(`${TEST_TITLE_UPDATE} Other User`);
  const listingId = createdResponse.body.listing.listingId;

  const response = await requestJson(`/api/listings/${listingId}`, {
    method: "PUT",
    token: otherUserToken,
    body: {
      title: "Not allowed",
      description: "Should fail",
      category: "job",
      contactMethod: "email",
      contactDetails: "nope@example.com",
      bannerImageUrl: "",
      customColor: "",
      status: "open",
      expirationDate: null,
      skills: [],
      attachments: []
    }
  });

  assert.equal(response.status, 403);
});

test("DELETE /api/listings/:listingId closes the listing without removing it", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_DELETE);
  const listingId = createdResponse.body.listing.listingId;

  const deleteResponse = await requestJson(`/api/listings/${listingId}`, {
    method: "DELETE",
    token: ownerToken
  });

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.message, "Listing closed successfully");
  assert.equal(deleteResponse.body.listing.status, "closed");

  const getResponse = await requestJson(`/api/listings/${listingId}`);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.listing.listingId, listingId);
  assert.equal(getResponse.body.listing.status, "closed");

  const openListingsResponse = await requestJson("/api/listings?status=open&limit=50");
  assert.equal(openListingsResponse.status, 200);
  assert.ok(
    openListingsResponse.body.items.every((item) => item.listingId !== listingId)
  );
});

test("POST /api/listings/:listingId/reopen reopens a closed listing", async () => {
  const createdResponse = await createTestListing(`${TEST_TITLE_DELETE} Reopen`);
  const listingId = createdResponse.body.listing.listingId;

  const closeResponse = await requestJson(`/api/listings/${listingId}`, {
    method: "DELETE",
    token: ownerToken
  });

  assert.equal(closeResponse.status, 200);
  assert.equal(closeResponse.body.listing.status, "closed");

  const reopenResponse = await requestJson(`/api/listings/${listingId}/reopen`, {
    method: "POST",
    token: ownerToken
  });

  assert.equal(reopenResponse.status, 200);
  assert.equal(reopenResponse.body.message, "Listing reopened successfully");
  assert.equal(reopenResponse.body.listing.status, "open");

  const getResponse = await requestJson(`/api/listings/${listingId}`);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.listing.status, "open");
});

test("DELETE /api/listings/:listingId/permanent removes the listing and its applications", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_PERMANENT_DELETE);
  const listingId = createdResponse.body.listing.listingId;

  const applicationResponse = await requestJson("/api/applications", {
    method: "POST",
    token: otherUserToken,
    body: {
      listingId,
      message: TEST_APPLICATION_MESSAGE
    }
  });

  assert.equal(applicationResponse.status, 201);

  const applicationId = applicationResponse.body.application.applicationId;
  const deleteResponse = await requestJson(`/api/listings/${listingId}/permanent`, {
    method: "DELETE",
    token: ownerToken
  });

  assert.equal(deleteResponse.status, 200);
  assert.equal(
    deleteResponse.body.message,
    "Listing permanently deleted successfully"
  );

  const getResponse = await requestJson(`/api/listings/${listingId}`);
  assert.equal(getResponse.status, 404);

  const applicationResult = await query(
    "SELECT application_id FROM applications WHERE application_id = $1",
    [applicationId]
  );

  assert.equal(applicationResult.rowCount, 0);
});
