import { logInfo } from "../utils/logger.js";

export function requestLogger(req, _res, next) {
  // Log only method/path so request bodies and tokens never appear in logs.
  logInfo("Incoming request", {
    method: req.method,
    path: req.originalUrl
  });
  next();
}
