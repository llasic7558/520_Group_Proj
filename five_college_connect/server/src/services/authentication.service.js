import crypto from "crypto";
import argon2 from "argon2";

import { env } from "../config/env.js";
import { createHttpError } from "../utils/http-error.js";

function createBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;

  return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64").toString("utf8");
}

function timingSafeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
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

  verifyAuthToken(token) {
    if (!token || typeof token !== "string") {
      throw createHttpError(401, "Authentication token is required");
    }

    const [payloadEncoded, providedSignature, ...extraParts] = token.split(".");

    if (!payloadEncoded || !providedSignature || extraParts.length > 0) {
      throw createHttpError(401, "Authentication token is invalid");
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.authTokenSecret)
      .update(payloadEncoded)
      .digest("hex");

    if (!timingSafeCompare(providedSignature, expectedSignature)) {
      throw createHttpError(401, "Authentication token is invalid");
    }

    let payload;

    try {
      payload = JSON.parse(decodeBase64Url(payloadEncoded));
    } catch {
      throw createHttpError(401, "Authentication token is invalid");
    }

    if (!payload.userId || !payload.email || !payload.role || !payload.expiresAt) {
      throw createHttpError(401, "Authentication token is invalid");
    }

    if (Date.now() > Number(payload.expiresAt)) {
      throw createHttpError(401, "Authentication token has expired");
    }

    return payload;
  }
}
