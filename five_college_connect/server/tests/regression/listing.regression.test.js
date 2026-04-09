import test from "node:test";
import assert from "node:assert/strict";

import app from "../../src/app.js";
import { query, testDatabaseConnection } from "../../src/config/db.js";

const TEST_TITLE = "Integration Test Listing";
const TEST_TITLE_GET = "Integration Test Listing Get";
const TEST_TITLE_UPDATE = "Integration Test Listing Update";
const TEST_TITLE_DELETE = "Integration Test Listing Delete";
const TEST_USER_ID = "a1000000-0000-0000-0000-000000000001";

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

async function deleteTestListings() {
  await query("DELETE FROM listings WHERE title LIKE $1", ["Integration Test Listing%"]);
}

async function createTestListing(title = TEST_TITLE) {
  return requestJson("/api/listings", {
    method: "POST",
    body: {
      createdByUserId: TEST_USER_ID,
      title,
      description: "Created by integration test",
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
});

test.after(async () => {
  await deleteTestListings();

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

test("POST /api/listings creates a listing with skills and attachments", async () => {
  const response = await createTestListing(TEST_TITLE);

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Listing created successfully");
  assert.equal(response.body.listing.title, TEST_TITLE);
  assert.equal(response.body.listing.skills.length, 1);
  assert.equal(response.body.listing.attachments.length, 1);
});

test("GET /api/listings returns listing items", async () => {
  const response = await requestJson("/api/listings?limit=5");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 1);
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
});

test("PUT /api/listings/:listingId updates listing fields and related rows", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_UPDATE);
  const listingId = createdResponse.body.listing.listingId;

  const response = await requestJson(`/api/listings/${listingId}`, {
    method: "PUT",
    body: {
      title: `${TEST_TITLE_UPDATE} Edited`,
      description: "Updated by integration test",
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

test("DELETE /api/listings/:listingId removes the listing", async () => {
  const createdResponse = await createTestListing(TEST_TITLE_DELETE);
  const listingId = createdResponse.body.listing.listingId;

  const deleteResponse = await requestJson(`/api/listings/${listingId}`, {
    method: "DELETE"
  });

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.message, "Listing deleted successfully");

  const getResponse = await requestJson(`/api/listings/${listingId}`);
  assert.equal(getResponse.status, 404);
  assert.equal(getResponse.body.message, "Listing not found");
});
