import { logInfo } from "../utils/logger.js";

export function requestLogger(req, _res, next) {
  logInfo("Incoming request", {
    method: req.method,
    path: req.originalUrl
  });
  next();
}
