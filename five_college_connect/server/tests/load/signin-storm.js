import { check } from "k6";

import {
  authLatency,
  buildThresholds,
  defaultPassword,
  jsonParams,
  matchesExpectedUser,
  parseJson,
  pickRandom,
  recordTrend,
  requestJson,
  seededUsers,
  think
} from "./config.js";

export const options = {
  scenarios: {
    signin_storm: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_VUS || 20),
      duration: __ENV.K6_DURATION || "15s"
    }
  },
  thresholds: {
    ...buildThresholds(Number(__ENV.K6_P95_MS || 2000), Number(__ENV.K6_FAILED_RATE || 0.05)),
    fcc_auth_latency: [`p(95)<${Number(__ENV.K6_AUTH_P95_MS || 1500)}`]
  }
};

export default function () {
  const account = pickRandom(seededUsers);
  const response = requestJson("signin storm", "POST", "/api/auth/signin", {
    email: account.email,
    password: defaultPassword
  }, jsonParams());
  recordTrend(authLatency, response);

  const payload = parseJson(response);
  check(response, {
    "signin storm status is 200": (res) => res.status === 200,
    "signin storm returns token": () => Boolean(payload?.authToken),
    "signin storm returns expected user": () => matchesExpectedUser(payload, account)
  });

  think(0, 0.05);
}
