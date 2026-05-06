import { check, group } from "k6";
import http from "k6/http";

import { apiChecks, buildThresholds, think } from "./config.js";

const frontendBaseUrl = (__ENV.K6_FRONTEND_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const frontendRoutes = ["/", "/login", "/signup"];
const assetPattern = /(?:src|href)="([^"]+\.(?:js|css|svg|png|jpg|jpeg|webp))"/g;

export const options = {
  scenarios: {
    frontend_pages: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 20),
      duration: __ENV.K6_DURATION || "15s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 1500), Number(__ENV.K6_FAILED_RATE || 0.03))
  }
};

function extractAssets(html) {
  const matches = [];

  for (const match of html.matchAll(assetPattern)) {
    const rawPath = match[1];

    if (!rawPath) {
      continue;
    }

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      matches.push(rawPath);
      continue;
    }

    matches.push(`${frontendBaseUrl}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`);
  }

  return [...new Set(matches)];
}

function fetchRoute(route) {
  const response = http.get(`${frontendBaseUrl}${route}`);
  const ok = check(response, {
    [`${route} page status is 200`]: (res) => res.status === 200,
    [`${route} page contains html`]: (res) =>
      String(res.headers["Content-Type"] || "").includes("text/html")
  });

  apiChecks.add(ok);

  const assetUrls = extractAssets(response.body || "");

  if (assetUrls.length === 0) {
    return;
  }

  const assetResponses = http.batch(assetUrls.map((url) => ["GET", url, null, {}]));

  for (const assetResponse of assetResponses) {
    const assetOk = check(assetResponse, {
      [`asset ${assetResponse.url} status is 200`]: (res) => res.status === 200
    });
    apiChecks.add(assetOk);
  }
}

export default function () {
  group("frontend route loads", () => {
    const route = frontendRoutes[Math.floor(Math.random() * frontendRoutes.length)];
    fetchRoute(route);
  });

  think(0.1, 0.5);
}
