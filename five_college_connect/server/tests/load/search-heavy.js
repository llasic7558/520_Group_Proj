import { check, group } from "k6";

import {
  buildThresholds,
  jsonParams,
  parseJson,
  pickRandom,
  recordTrend,
  requestJson,
  searchLatency,
  think
} from "./config.js";

const searchCases = splitSearchCases(__ENV.K6_SEARCH_CASES, [
  { category: "project", query: "Campus Search Performance" },
  { category: "tutoring", query: "Research Match" },
  { category: "job", query: "Data Structures Help" },
  { category: "study_group", query: "Design Critique" }
]);

export const options = {
  scenarios: {
    search_listings: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 40),
      duration: __ENV.K6_DURATION || "30s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 1200), Number(__ENV.K6_FAILED_RATE || 0.03)),
    fcc_search_latency: [`p(95)<${Number(__ENV.K6_SEARCH_P95_MS || 1000)}`]
  }
};

function buildSearchPath() {
  const searchCase = pickRandom(searchCases);
  const pairs = [
    `category=${encodeURIComponent(searchCase.category)}`,
    `query=${encodeURIComponent(searchCase.query)}`,
    `limit=${Number(__ENV.K6_SEARCH_LIMIT || 20)}`
  ];

  return `/api/search/listings?${pairs.join("&")}`;
}

export default function () {
  group("search listings", () => {
    const response = requestJson(
      "search listings",
      "GET",
      buildSearchPath(),
      null,
      jsonParams()
    );
    recordTrend(searchLatency, response);

    const payload = parseJson(response);
    check(response, {
      "search listings status is 200": (res) => res.status === 200,
      "search listings returns an array": () => Array.isArray(payload?.items),
      "search listings returns at least one match": () => (payload?.items?.length || 0) > 0
    });
  });

  think(0.1, 0.5);
}

function splitSearchCases(value, fallback) {
  const configured = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [category, query] = item.split("|").map((part) => part.trim());

      if (!category || !query) {
        return null;
      }

      return { category, query };
    })
    .filter(Boolean);

  return configured.length > 0 ? configured : fallback;
}
