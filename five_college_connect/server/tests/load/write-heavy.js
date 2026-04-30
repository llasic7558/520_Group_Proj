import exec from "k6/execution";
import { check, group } from "k6";

import {
  buildThresholds,
  createListingLatency,
  createListingPayload,
  deleteListingLatency,
  jsonParams,
  parseJson,
  pickAccount,
  recordTrend,
  requestJson,
  signInSeededUsers,
  think
} from "./config.js";

export const options = {
  scenarios: {
    listing_write_pressure: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 4),
      duration: __ENV.K6_DURATION || "60s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 1200), Number(__ENV.K6_FAILED_RATE || 0.03)),
    fcc_create_listing_latency: [`p(95)<${Number(__ENV.K6_CREATE_P95_MS || 1200)}`],
    fcc_delete_listing_latency: [`p(95)<${Number(__ENV.K6_DELETE_P95_MS || 900)}`]
  }
};

export function setup() {
  return {
    accounts: signInSeededUsers().slice(0, 3)
  };
}

export default function (data) {
  const account = pickAccount(data.accounts);
  const params = jsonParams(account.token);
  const payload = createListingPayload(exec.vu.idInTest, exec.scenario.iterationInTest);

  group("create and delete listing", () => {
    const createResponse = requestJson("create listing", "POST", "/api/listings", payload, params);
    recordTrend(createListingLatency, createResponse);

    const createBody = parseJson(createResponse);
    const createdListingId = createBody?.listing?.listingId;

    check(createResponse, {
      "create listing status is 201": (res) => res.status === 201,
      "create listing returns an id": () => Boolean(createdListingId)
    });

    if (!createdListingId) {
      return;
    }

    const detailResponse = requestJson(
      "get created listing",
      "GET",
      `/api/listings/${createdListingId}`,
      null,
      params
    );
    check(detailResponse, {
      "created listing detail is readable": (res) => res.status === 200
    });

    const deleteResponse = requestJson(
      "delete listing",
      "DELETE",
      `/api/listings/${createdListingId}`,
      null,
      params
    );
    recordTrend(deleteListingLatency, deleteResponse);

    check(deleteResponse, {
      "delete listing status is 200": (res) => res.status === 200
    });
  });

  think(0.1, 0.4);
}
