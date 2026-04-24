import { logError, logWarn } from "../utils/logger.js";

export function notFoundHandler(_req, res) {
  logWarn("Route not found");
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (statusCode >= 500) {
    logError("Unhandled server error", {
      statusCode,
      message,
      stack: err.stack
    });
  } else {
    logWarn("Handled request error", {
      statusCode,
      message,
      details: err.details || null
    });
  }

  res.status(statusCode).json({
    message,
    details: err.details || null
  });
}
