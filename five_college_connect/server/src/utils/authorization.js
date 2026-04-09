import { createHttpError } from "./http-error.js";

export function isAdmin(user) {
  return user?.role === "admin";
}

export function ensureAuthenticatedUser(user) {
  if (!user?.userId) {
    throw createHttpError(401, "You must be signed in to access this resource");
  }
}

export function ensureOwnerOrAdmin(user, ownerUserId, resourceLabel = "resource") {
  ensureAuthenticatedUser(user);

  if (isAdmin(user) || user.userId === ownerUserId) {
    return;
  }

  throw createHttpError(403, `You can only manage your own ${resourceLabel}`);
}
