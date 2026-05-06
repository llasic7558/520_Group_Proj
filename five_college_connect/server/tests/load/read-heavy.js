import { check, group } from "k6";

import {
  buildThresholds,
  jsonParams,
  listingDetailsLatency,
  listingsLatency,
  parseJson,
  pickRandom,
  recordTrend,
  requestJson,
  think
} from "./config.js";

const categories = ["", "tutoring", "project", "job"];
const searchTerms = ["", "React", "Tutor", "Research", "Designer", "Data Structures"];

export const options = {
  scenarios: {
    browse_listings: {
      executor: "ramping-arrival-rate",
      startRate: Number(__ENV.K6_START_RATE || 2),
      timeUnit: "1s",
      preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 20),
      maxVUs: Number(__ENV.K6_MAX_VUS || 80),
      stages: [
        { target: Number(__ENV.K6_RATE_STAGE_1 || 5), duration: __ENV.K6_STAGE_1 || "30s" },
        { target: Number(__ENV.K6_RATE_STAGE_2 || 15), duration: __ENV.K6_STAGE_2 || "45s" },
        { target: Number(__ENV.K6_RATE_STAGE_3 || 30), duration: __ENV.K6_STAGE_3 || "45s" },
        { target: 0, duration: __ENV.K6_STAGE_4 || "20s" }
      ]
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 900), Number(__ENV.K6_FAILED_RATE || 0.02)),
    fcc_listings_latency: [`p(95)<${Number(__ENV.K6_LISTINGS_P95_MS || 800)}`],
    fcc_listing_details_latency: [`p(95)<${Number(__ENV.K6_LISTING_DETAIL_P95_MS || 700)}`]
  }
};

function buildListingsPath() {
  const category = pickRandom(categories);
  const query = pickRandom(searchTerms);
  const pairs = ["limit=10"];

  if (category) {
    pairs.push(`category=${encodeURIComponent(category)}`);
  }

  if (query) {
    pairs.push(`query=${encodeURIComponent(query)}`);
  }

  return `/api/listings?${pairs.join("&")}`;
}

export default function () {
  group("listings browse", () => {
    const response = requestJson(
      "browse listings",
      "GET",
      buildListingsPath(),
      null,
      jsonParams()
    );
    recordTrend(listingsLatency, response);

    const payload = parseJson(response);
    check(response, {
      "browse listings status is 200": (res) => res.status === 200,
      "browse listings returns an array": () => Array.isArray(payload?.items)
    });

    if (Array.isArray(payload?.items) && payload.items.length > 0) {
      const listing = pickRandom(payload.items);
      const detailResponse = requestJson(
        "listing details",
        "GET",
        `/api/listings/${listing.listingId}`,
        null,
        jsonParams()
      );
      recordTrend(listingDetailsLatency, detailResponse);

      const detailPayload = parseJson(detailResponse);
      check(detailResponse, {
        "listing details status is 200": (res) => res.status === 200,
        "listing details includes creator": () => Boolean(detailPayload?.listing?.creator),
        "listing details includes skills array": () =>
          Array.isArray(detailPayload?.listing?.skills)
      });
    }
  });

  think();
}
