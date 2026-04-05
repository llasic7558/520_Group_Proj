import crypto from "crypto";
import argon2 from "argon2";

import { env } from "../config/env.js";

function createBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export class AuthenticationService {
  isAllowedUniversityEmail(email) {
    const domain = email.split("@")[1]?.toLowerCase();
    return env.allowedEmailDomains.includes(domain);
  }

  async hashPassword(password) {
    return argon2.hash(password, {
      type: argon2.argon2id
    });
  }

  async verifyPassword(password, storedHash) {
    return argon2.verify(storedHash, password);
  }

  createAuthToken({ userId, email, role }) {
    // This is intentionally lightweight for Week 2.
    // It gives the frontend a usable login token without introducing a larger auth stack yet.
    const expiresAt = Date.now() + env.authTokenExpiresInHours * 60 * 60 * 1000;

    const payload = {
      userId,
      email,
      role,
      expiresAt
    };

    const payloadString = JSON.stringify(payload);
    const payloadEncoded = createBase64Url(payloadString);
    const signature = crypto
      .createHmac("sha256", env.authTokenSecret)
      .update(payloadEncoded)
      .digest("hex");

    return `${payloadEncoded}.${signature}`;
  }
}
