import { createHttpError } from "../utils/http-error.js";

function ensureString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSignUpPayload(payload) {
  const email = ensureString(payload.email).toLowerCase();
  const username = ensureString(payload.username);
  const password = ensureString(payload.password);
  const role = ensureString(payload.role || "student").toLowerCase();

  if (!email || !username || !password) {
    throw createHttpError(400, "email, username, and password are required");
  }

  if (password.length < 8) {
    throw createHttpError(400, "password must be at least 8 characters long");
  }

  return {
    email,
    username,
    password,
    role
  };
}

export function validateSignInPayload(payload) {
  const email = ensureString(payload.email).toLowerCase();
  const password = ensureString(payload.password);

  if (!email || !password) {
    throw createHttpError(400, "email and password are required");
  }

  return { email, password };
}
