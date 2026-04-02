import { createHttpError } from "../utils/http-error.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value) {
  return value === true;
}

function normalizeSkillArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      name: normalizeString(item?.name),
      category: normalizeString(item?.category),
      proficiencyLevel: normalizeString(item?.proficiencyLevel || item?.proficiency_level),
      isOfferingHelp: normalizeBoolean(item?.isOfferingHelp ?? item?.is_offering_help),
      isSeekingHelp: normalizeBoolean(item?.isSeekingHelp ?? item?.is_seeking_help)
    }))
    .filter((item) => item.name);
}

function normalizeCourseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      courseCode: normalizeString(item?.courseCode || item?.course_code),
      courseName: normalizeString(item?.courseName || item?.course_name),
      institution: normalizeString(item?.institution),
      status: normalizeString(item?.status),
      grade: normalizeString(item?.grade)
    }))
    .filter((item) => item.courseCode);
}

export function validateProfilePayload(payload) {
  // The frontend can send the full profile in one payload.
  // Direct fields go to the profiles table, while skills/courses go to their
  // relationship tables.
  const fullName = normalizeString(payload.fullName || payload.full_name);
  const bio = normalizeString(payload.bio);
  const college = normalizeString(payload.college);
  const major = normalizeString(payload.major);
  const graduationYearValue = payload.graduationYear ?? payload.graduation_year;
  const graduationYear =
    graduationYearValue === undefined || graduationYearValue === null || graduationYearValue === ""
      ? null
      : Number(graduationYearValue);
  const interests = normalizeString(payload.interests);
  const availability = normalizeString(payload.availability);
  const lookingFor = normalizeString(payload.lookingFor || payload.looking_for);
  const profileImageUrl = normalizeString(payload.profileImageUrl || payload.profile_image_url);
  const skills = normalizeSkillArray(payload.skills);
  const courses = normalizeCourseArray(
    payload.courses || payload.coursesTaken || payload.courses_taken
  );

  if (!college) {
    throw createHttpError(400, "college is required");
  }

  if (graduationYear !== null && Number.isNaN(graduationYear)) {
    throw createHttpError(400, "graduationYear must be a number");
  }

  return {
    fullName,
    bio,
    college,
    major,
    graduationYear,
    skills,
    courses,
    interests,
    availability,
    lookingFor,
    profileImageUrl
  };
}
