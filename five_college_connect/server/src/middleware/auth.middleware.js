import { AuthenticationService } from "../services/authentication.service.js";
import { createHttpError } from "../utils/http-error.js";

const authenticationService = new AuthenticationService();

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    throw createHttpError(401, "Authorization header is required");
  }

  const [scheme, token, ...extraParts] = headerValue.trim().split(/\s+/);

  if (scheme !== "Bearer" || !token || extraParts.length > 0) {
    throw createHttpError(401, "Authorization header must use Bearer token format");
  }

  return token;
}

export function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    req.user = authenticationService.verifyAuthToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
