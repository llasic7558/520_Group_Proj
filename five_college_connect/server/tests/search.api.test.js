import test from "node:test";
import assert from "node:assert/strict";

import app from "../src/app.js";
import { query, testDatabaseConnection } from "../src/config/db.js";

const SEEDED_PASSWORD = "DemoPass123!";
const OWNER_EMAIL = "emily.rodriguez@umass.edu";
const SEARCH_TITLE_MIXED = "API Search Alpha Calculus";
const SEARCH_TITLE_SECOND = "API Search Beta calculus";
const SEARCH_TITLE_OTHER_CATEGORY = "API Search Gamma Calculus";

let server;
let baseUrl;
let ownerToken;

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

async function deleteSearchListings() {
  await query("DELETE FROM listings WHERE title LIKE $1", ["API Search %"]);
}

async function createSearchListing({ title, category }) {
  const response = await requestJson("/api/listings", {
    method: "POST",
    token: ownerToken,
    body: {
      title,
      description: "Created by API search test",
      category,
      contactMethod: "email",
      contactDetails: "search-test@umass.edu",
      customColor: "#abcdef",
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

  await deleteSearchListings();
  ownerToken = await signIn(OWNER_EMAIL, SEEDED_PASSWORD);

  await createSearchListing({
    title: SEARCH_TITLE_MIXED,
    category: "Tutoring"
  });
  await createSearchListing({
    title: SEARCH_TITLE_SECOND,
    category: "Tutoring"
  });
  await createSearchListing({
    title: SEARCH_TITLE_OTHER_CATEGORY,
    category: "Jobs"
  });
});

test.after(async () => {
  await deleteSearchListings();

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

test("GET /api/listings supports case-insensitive title search", async () => {
  const response = await requestJson("/api/listings?query=calCuLus&limit=10");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));

  const titles = response.body.items.map((item) => item.title);
  assert.ok(titles.includes(SEARCH_TITLE_MIXED));
  assert.ok(titles.includes(SEARCH_TITLE_SECOND));
  assert.ok(titles.includes(SEARCH_TITLE_OTHER_CATEGORY));
});

test("GET /api/listings ignores empty or whitespace-only search queries", async () => {
  const emptyResponse = await requestJson("/api/listings?query=&limit=10");
  const whitespaceResponse = await requestJson("/api/listings?query=%20%20%20&limit=10");

  assert.equal(emptyResponse.status, 200);
  assert.equal(whitespaceResponse.status, 200);
  assert.ok(emptyResponse.body.items.length >= 3);
  assert.ok(whitespaceResponse.body.items.length >= 3);
});

test("GET /api/listings combines title search with category filters", async () => {
  const response = await requestJson(
    "/api/listings?category=Tutoring&query=calculus&limit=10"
  );

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.equal(response.body.items.length, 2);
  assert.ok(response.body.items.every((item) => item.category === "Tutoring"));
});

test("GET /api/listings treats category=All as no category filter", async () => {
  const response = await requestJson("/api/listings?category=All&query=calculus&limit=10");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.items));
  assert.ok(response.body.items.length >= 3);
});

test("GET /api/listings treats category casing variants of all as no category filter", async () => {
  const lowerResponse = await requestJson("/api/listings?category=all&query=calculus&limit=10");
  const upperResponse = await requestJson("/api/listings?category=ALL&query=calculus&limit=10");

  assert.equal(lowerResponse.status, 200);
  assert.equal(upperResponse.status, 200);
  assert.ok(lowerResponse.body.items.length >= 3);
  assert.ok(upperResponse.body.items.length >= 3);
});

test("GET /api/listings applies default and capped limits safely", async () => {
  const defaultResponse = await requestJson("/api/listings?query=calculus");
  const zeroResponse = await requestJson("/api/listings?query=calculus&limit=0");
  const negativeResponse = await requestJson("/api/listings?query=calculus&limit=-5");
  const hugeResponse = await requestJson("/api/listings?query=calculus&limit=999");

  assert.equal(defaultResponse.status, 200);
  assert.equal(zeroResponse.status, 200);
  assert.equal(negativeResponse.status, 200);
  assert.equal(hugeResponse.status, 200);
  assert.ok(defaultResponse.body.items.length >= 3);
  assert.ok(zeroResponse.body.items.length >= 3);
  assert.ok(negativeResponse.body.items.length >= 3);
  assert.ok(hugeResponse.body.items.length >= 3);
  assert.ok(hugeResponse.body.items.length <= 50);
});

test("GET /api/listings supports exact listing ID search", async () => {
  const created = await createSearchListing({
    title: "API Search UUID Target",
    category: "Projects"
  });

  const response = await requestJson(`/api/listings?query=${created.listingId}&limit=10`);

  assert.equal(response.status, 200);
  assert.equal(response.body.items.length, 1);
  assert.equal(response.body.items[0].listingId, created.listingId);
  assert.equal(response.body.items[0].title, "API Search UUID Target");
});
