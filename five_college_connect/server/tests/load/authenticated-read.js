import { check, group } from "k6";

import {
  applicationsLatency,
  buildThresholds,
  jsonParams,
  notificationsLatency,
  parseJson,
  pickAccount,
  recordTrend,
  requestJson,
  signInSeededUsers,
  think
} from "./config.js";

export const options = {
  scenarios: {
    authenticated_reads: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 8),
      duration: __ENV.K6_DURATION || "90s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 1000), Number(__ENV.K6_FAILED_RATE || 0.02)),
    fcc_notifications_latency: [`p(95)<${Number(__ENV.K6_NOTIFICATIONS_P95_MS || 800)}`],
    fcc_applications_latency: [`p(95)<${Number(__ENV.K6_APPLICATIONS_P95_MS || 800)}`]
  }
};

export function setup() {
  return {
    accounts: signInSeededUsers()
  };
}

export default function (data) {
  const account = pickAccount(data.accounts);
  const params = jsonParams(account.token);

  group("profile read", () => {
    const profileResponse = requestJson(
      "get profile",
      "GET",
      `/api/profiles/${account.userId}`,
      null,
      params
    );
    const profilePayload = parseJson(profileResponse);

    check(profileResponse, {
      "profile status is 200": (res) => res.status === 200,
      "profile belongs to signed-in user": () => profilePayload?.profile?.userId === account.userId
    });
  });

  group("application read", () => {
    const response = requestJson("get applications", "GET", "/api/applications?limit=10", null, params);
    recordTrend(applicationsLatency, response);

    const payload = parseJson(response);
    check(response, {
      "applications status is 200": (res) => res.status === 200,
      "applications returns an array": () => Array.isArray(payload?.items)
    });
  });

  group("notification read", () => {
    const response = requestJson(
      "get notifications",
      "GET",
      "/api/notifications?limit=10&unreadOnly=true",
      null,
      params
    );
    recordTrend(notificationsLatency, response);

    const payload = parseJson(response);
    check(response, {
      "notifications status is 200": (res) => res.status === 200,
      "notifications has items": () => Array.isArray(payload?.items),
      "notifications has unread count": () => Number.isInteger(payload?.unreadCount)
    });
  });

  think();
}
