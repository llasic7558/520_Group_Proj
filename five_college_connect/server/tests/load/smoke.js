import { check } from "k6";

import {
  baseUrl,
  buildThresholds,
  jsonParams,
  parseJson,
  requestJson,
  think
} from "./config.js";

export const options = {
  vus: Number(__ENV.K6_VUS || 1),
  iterations: Number(__ENV.K6_ITERATIONS || 5),
  thresholds: buildThresholds(Number(__ENV.K6_P95_MS || 500), Number(__ENV.K6_FAILED_RATE || 0.01))
};

export default function () {
  const healthResponse = requestJson("health", "GET", "/health", null, jsonParams());
  check(healthResponse, {
    "health status is 200": (res) => res.status === 200
  });

  const listingsResponse = requestJson("listings", "GET", "/api/listings?limit=5", null, jsonParams());
  const listingsPayload = parseJson(listingsResponse);

  check(listingsResponse, {
    "listings status is 200": (res) => res.status === 200,
    "listings returns items": () => Array.isArray(listingsPayload?.items)
  });

  if (Array.isArray(listingsPayload?.items) && listingsPayload.items.length > 0) {
    const listingId = listingsPayload.items[0].listingId;
    const detailResponse = requestJson(
      "listing detail",
      "GET",
      `/api/listings/${listingId}`,
      null,
      jsonParams()
    );
    const detailPayload = parseJson(detailResponse);

    check(detailResponse, {
      "listing detail status is 200": (res) => res.status === 200,
      "listing detail returns a listing": () => Boolean(detailPayload?.listing)
    });
  }

  if (__ENV.K6_DEBUG === "true") {
    console.log(`Smoke test against ${baseUrl} succeeded for this iteration`);
  }

  think(0.1, 0.3);
}
