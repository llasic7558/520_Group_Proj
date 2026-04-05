import cors from "cors";
import express from "express";

import { getDbStatus } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "five-college-connector-server",
    database: getDbStatus()
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
