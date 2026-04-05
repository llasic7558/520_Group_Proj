export function notFoundHandler(_req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    details: err.details || null
  });
}
