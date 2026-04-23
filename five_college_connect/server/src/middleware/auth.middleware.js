import { AuthenticationService } from "../services/authentication.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createHttpError } from "../utils/http-error.js";

const authenticationService = new AuthenticationService();
const userRepository = new UserRepository();

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

export async function requireVerifiedEmail(req, _res, next) {
  try {
    const user = await userRepository.findById(req.user?.userId);

    if (!user) {
      throw createHttpError(401, "Authenticated user was not found");
    }

    if (!user.emailVerified) {
      throw createHttpError(403, "Email verification required", {
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    req.user = {
      ...req.user,
      emailVerified: user.emailVerified
    };

    next();
  } catch (error) {
    next(error);
  }
}
