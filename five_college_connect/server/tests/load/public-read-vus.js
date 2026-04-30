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
    public_listing_reads: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 20),
      duration: __ENV.K6_DURATION || "15s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 1200), Number(__ENV.K6_FAILED_RATE || 0.03)),
    fcc_listings_latency: [`p(95)<${Number(__ENV.K6_LISTINGS_P95_MS || 1000)}`],
    fcc_listing_details_latency: [`p(95)<${Number(__ENV.K6_LISTING_DETAIL_P95_MS || 1000)}`]
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
  group("public listings browse", () => {
    const response = requestJson(
      "public listings",
      "GET",
      buildListingsPath(),
      null,
      jsonParams()
    );
    recordTrend(listingsLatency, response);

    const payload = parseJson(response);
    check(response, {
      "public listings status is 200": (res) => res.status === 200,
      "public listings returns array": () => Array.isArray(payload?.items)
    });

    if (Array.isArray(payload?.items) && payload.items.length > 0) {
      const listing = pickRandom(payload.items);
      const detailResponse = requestJson(
        "public listing detail",
        "GET",
        `/api/listings/${listing.listingId}`,
        null,
        jsonParams()
      );
      recordTrend(listingDetailsLatency, detailResponse);

      const detailPayload = parseJson(detailResponse);
      check(detailResponse, {
        "public listing detail status is 200": (res) => res.status === 200,
        "public listing detail includes creator": () => Boolean(detailPayload?.listing?.creator)
      });
    }
  });

  think(0.1, 0.5);
}
