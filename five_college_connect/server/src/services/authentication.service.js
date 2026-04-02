import crypto from "crypto";

import { env } from "../config/env.js";
import { createHttpError } from "../utils/http-error.js";

const SCRYPT_KEY_LENGTH = 64;

function createBase64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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
    const salt = crypto.randomBytes(16).toString("hex");

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      });
    });

    return `${salt}:${derivedKey.toString("hex")}`;
  }

  async verifyPassword(password, storedHash) {
    const [salt, expectedHash] = storedHash.split(":");

    if (!salt || !expectedHash) {
      throw createHttpError(500, "Stored password hash is invalid");
    }

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      });
    });

    return timingSafeCompare(derivedKey.toString("hex"), expectedHash);
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
