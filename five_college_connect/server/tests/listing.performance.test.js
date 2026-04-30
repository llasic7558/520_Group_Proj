import test from "node:test";
import assert from "node:assert/strict";

import { query, testDatabaseConnection } from "../src/config/db.js";
import { ListingService } from "../src/services/listing.service.js";
import { SearchService } from "../src/services/search.service.js";

const OWNER_EMAIL = "emily.rodriguez@umass.edu";
const PERF_TITLE_PREFIX = "API Perf Listing";
const PERF_QUERY = "Performance Hot Path";
const PERF_LISTING_COUNT = 12;

const listingService = new ListingService();
const searchService = new SearchService();

async function getOwnerUserId() {
  const result = await query("SELECT user_id FROM users WHERE email = $1", [OWNER_EMAIL]);
  return result.rows[0]?.user_id || null;
}

async function ensureSkillId(name, category) {
  const result = await query(
    `
      INSERT INTO skills (name, category)
      VALUES ($1, $2)
      ON CONFLICT (name, category)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING skill_id
    `,
    [name, category]
  );

  return result.rows[0].skill_id;
}

async function deletePerformanceListings() {
  await query("DELETE FROM listings WHERE title LIKE $1", [`${PERF_TITLE_PREFIX}%`]);
}

async function seedPerformanceListings() {
  const ownerUserId = await getOwnerUserId();
  const skillId = await ensureSkillId("Performance Testing", "Tooling");

  assert.ok(ownerUserId, "Seeded owner user must exist for performance listings");

  for (let index = 0; index < PERF_LISTING_COUNT; index += 1) {
    const insertResult = await query(
      `
        INSERT INTO listings (
          created_by_user_id,
          title,
          description,
          category,
          contact_method,
          contact_details,
          custom_color,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
        RETURNING listing_id
      `,
      [
        ownerUserId,
        `${PERF_TITLE_PREFIX} ${index} ${PERF_QUERY}`,
        "Seeded to catch listing/search regressions.",
        "project",
        "email",
        "performance-test@umass.edu",
        "#445566"
      ]
    );

    const listingId = insertResult.rows[0].listing_id;

    await query(
      `
        INSERT INTO listing_skills (listing_id, skill_id, requirement_type)
        VALUES ($1, $2, 'required')
      `,
      [listingId, skillId]
    );

    await query(
      `
        INSERT INTO listing_attachments (listing_id, file_url, file_type)
        VALUES ($1, $2, $3)
      `,
      [listingId, `https://example.com/${listingId}.png`, "image/png"]
    );
  }
}

function createCountingExecutor() {
  let queryCount = 0;

  return {
    executor: {
      async query(text, params = []) {
        queryCount += 1;
        return query(text, params);
      }
    },
    getCount() {
      return queryCount;
    }
  };
}

test.before(async () => {
  await testDatabaseConnection();
  await deletePerformanceListings();
  await seedPerformanceListings();
});

test.after(async () => {
  await deletePerformanceListings();
});

test("ListingService.listListings keeps query count flat as result size grows", async () => {
  const { executor, getCount } = createCountingExecutor();

  const listings = await listingService.listListings(
    {
      query: PERF_QUERY,
      limit: PERF_LISTING_COUNT
    },
    executor
  );

  assert.equal(listings.length, PERF_LISTING_COUNT);
  assert.ok(
    listings.every((listing) => listing.skills.length === 1 && listing.attachments.length === 1),
    "Expected each listing to include related skills and attachments"
  );
  assert.ok(
    getCount() <= 5,
    `Expected batched listing reads to stay within 5 queries, received ${getCount()}`
  );
});

test("SearchService.searchListings keeps query count flat for filtered listing search", async () => {
  const { executor, getCount } = createCountingExecutor();

  const listings = await searchService.searchListings(
    {
      query: PERF_QUERY,
      category: "project",
      limit: PERF_LISTING_COUNT
    },
    executor
  );

  assert.equal(listings.length, PERF_LISTING_COUNT);
  assert.ok(
    listings.every((listing) => listing.category === "project"),
    "Expected the filtered search results to preserve the category filter"
  );
  assert.ok(
    getCount() <= 5,
    `Expected batched search reads to stay within 5 queries, received ${getCount()}`
  );
});
