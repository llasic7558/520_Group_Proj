import { createHttpError } from "../utils/http-error.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAttachmentArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      fileUrl: normalizeString(item?.fileUrl || item?.file_url),
      fileType: normalizeString(item?.fileType || item?.file_type)
    }))
    .filter((item) => item.fileUrl);
}

function normalizeSkillArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      name: normalizeString(item?.name),
      category: normalizeString(item?.category),
      requirementType: normalizeString(item?.requirementType || item?.requirement_type || "required")
    }))
    .filter((item) => item.name);
}

function normalizeExpirationDate(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeListingPayload(payload) {
  return {
    createdByUserId: normalizeString(payload.createdByUserId || payload.created_by_user_id),
    title: normalizeString(payload.title),
    description: normalizeString(payload.description),
    category: normalizeString(payload.category),
    contactMethod: normalizeString(payload.contactMethod || payload.contact_method),
    contactDetails: normalizeString(payload.contactDetails || payload.contact_details),
    bannerImageUrl: normalizeString(payload.bannerImageUrl || payload.banner_image_url),
    customColor: normalizeString(payload.customColor || payload.custom_color),
    status: normalizeString(payload.status || "open"),
    expirationDate: normalizeExpirationDate(payload.expirationDate || payload.expiration_date),
    skills: normalizeSkillArray(payload.skills),
    attachments: normalizeAttachmentArray(payload.attachments)
  };
}

export function validateCreateListingPayload(payload) {
  const normalized = normalizeListingPayload(payload);

  if (!normalized.createdByUserId || !normalized.title || !normalized.category) {
    throw createHttpError(400, "createdByUserId, title, and category are required");
  }

  return normalized;
}

export function validateUpdateListingPayload(payload) {
  const normalized = normalizeListingPayload(payload);

  if (!normalized.title || !normalized.category) {
    throw createHttpError(400, "title and category are required");
  }

  return normalized;
}
