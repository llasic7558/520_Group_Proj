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

export function validateApplicationStatusPayload(payload) {
  const status = normalizeString(payload.status).toLowerCase();
  const allowedStatuses = new Set(["pending", "accepted", "rejected"]);

  if (!allowedStatuses.has(status)) {
    throw createHttpError(400, "status must be pending, accepted, or rejected");
  }

  return { status };
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
