import { createHttpError } from "../utils/http-error.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePayload(payload) {
  return {
    listingId: normalizeString(payload.listingId || payload.listing_id),
    applicantUserId: normalizeString(payload.applicantUserId || payload.applicant_user_id),
    message: normalizeString(payload.message),
    status: normalizeString(payload.status || "pending")
  };
}

export function validateCreateApplicationPayload(payload) {
  const normalized = normalizePayload(payload);

  if (!normalized.listingId || !normalized.applicantUserId) {
    throw createHttpError(400, "listingId and applicantUserId are required");
  }

  return normalized;
}

export function validateUpdateApplicationPayload(payload) {
  const normalized = normalizePayload(payload);

  return {
    message: normalized.message,
    status: normalized.status || "pending"
  };
}
