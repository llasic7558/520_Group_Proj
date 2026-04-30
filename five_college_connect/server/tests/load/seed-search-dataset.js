import { query, testDatabaseConnection } from "../../src/config/db.js";

const ownerEmail = process.env.SEARCH_LOAD_OWNER_EMAIL || "emily.rodriguez@umass.edu";
const listingPrefix = process.env.SEARCH_LOAD_PREFIX || "K6 Search Load Listing";
const listingCount = Number(process.env.SEARCH_LOAD_LISTING_COUNT || 800);
const contactDetails = process.env.SEARCH_LOAD_CONTACT || "search-load@umass.edu";
const customColor = process.env.SEARCH_LOAD_COLOR || "#225577";
const skillName = process.env.SEARCH_LOAD_SKILL_NAME || "Search Load Testing";
const skillCategory = process.env.SEARCH_LOAD_SKILL_CATEGORY || "Tooling";
const searchTerms = splitCsv(
  process.env.SEARCH_LOAD_TERMS,
  [
    "Campus Search Performance",
    "Research Match",
    "Data Structures Help",
    "Design Critique"
  ]
);
const categories = splitCsv(
  process.env.SEARCH_LOAD_CATEGORIES,
  ["project", "tutoring", "job", "study_group"]
);

const mode = process.argv[2] || "seed";

async function main() {
  await testDatabaseConnection();

  if (mode === "cleanup") {
    const removed = await deleteSeededListings();
    console.log(`Removed ${removed} seeded search listings.`);
    return;
  }

  if (mode !== "seed") {
    throw new Error(`Unknown mode "${mode}". Use "seed" or "cleanup".`);
  }

  const ownerUserId = await getOwnerUserId();

  if (!ownerUserId) {
    throw new Error(`Could not find seeded owner account for ${ownerEmail}`);
  }

  const skillId = await ensureSkill();
  await deleteSeededListings();

  let createdCount = 0;
  const chunkSize = 200;

  for (let start = 0; start < listingCount; start += chunkSize) {
    const chunkLength = Math.min(chunkSize, listingCount - start);
    const seedRows = buildSeedRows(start, chunkLength);
    const insertedRows = await insertListingChunk(ownerUserId, seedRows);

    await attachSkillChunk(
      insertedRows.map((row) => row.listing_id),
      skillId
    );
    await attachAttachmentChunk(insertedRows);

    createdCount += insertedRows.length;
  }

  console.log(
    `Seeded ${createdCount} search listings for /api/search/listings load tests using prefix "${listingPrefix}".`
  );
}

async function getOwnerUserId() {
  const result = await query("SELECT user_id FROM users WHERE email = $1", [ownerEmail]);
  return result.rows[0]?.user_id || null;
}

async function ensureSkill() {
  const result = await query(
    `
      INSERT INTO skills (name, category)
      VALUES ($1, $2)
      ON CONFLICT (name, category)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING skill_id
    `,
    [skillName, skillCategory]
  );

  return result.rows[0].skill_id;
}

async function deleteSeededListings() {
  const result = await query(
    "DELETE FROM listings WHERE title LIKE $1 RETURNING listing_id",
    [`${listingPrefix}%`]
  );

  return result.rowCount;
}

function buildSeedRows(start, chunkLength) {
  return Array.from({ length: chunkLength }, (_, offset) => {
    const sequence = start + offset + 1;
    const term = searchTerms[(sequence - 1) % searchTerms.length];
    const category = categories[(sequence - 1) % categories.length];

    return {
      title: `${listingPrefix} ${sequence} ${term}`,
      description: `Seeded listing ${sequence} for search-load testing on the ${category} category.`,
      category
    };
  });
}

async function insertListingChunk(ownerUserId, seedRows) {
  const titles = seedRows.map((row) => row.title);
  const descriptions = seedRows.map((row) => row.description);
  const chunkCategories = seedRows.map((row) => row.category);

  const result = await query(
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
      SELECT
        $1::uuid,
        seeded.title,
        seeded.description,
        seeded.category,
        'email',
        $5,
        $6,
        'open'
      FROM UNNEST($2::text[], $3::text[], $4::text[]) AS seeded(title, description, category)
      RETURNING listing_id, title
    `,
    [ownerUserId, titles, descriptions, chunkCategories, contactDetails, customColor]
  );

  return result.rows;
}

async function attachSkillChunk(listingIds, skillId) {
  await query(
    `
      INSERT INTO listing_skills (listing_id, skill_id, requirement_type)
      SELECT listing_id, $2::uuid, 'required'
      FROM UNNEST($1::uuid[]) AS seeded(listing_id)
    `,
    [listingIds, skillId]
  );
}

async function attachAttachmentChunk(insertedRows) {
  const listingIds = insertedRows.map((row) => row.listing_id);
  const fileUrls = insertedRows.map(
    (row) => `https://example.com/search-load/${row.listing_id}.png`
  );

  await query(
    `
      INSERT INTO listing_attachments (listing_id, file_url, file_type)
      SELECT listing_id, file_url, 'image/png'
      FROM UNNEST($1::uuid[], $2::text[]) AS seeded(listing_id, file_url)
    `,
    [listingIds, fileUrls]
  );
}

function splitCsv(value, fallback) {
  const configured = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : fallback;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
