import { Router } from "express";

import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication
} from "../controllers/application.controller.js";

const router = Router();

router.post("/", createApplication);
router.get("/", listApplications);
router.get("/:applicationId", getApplication);
router.put("/:applicationId", updateApplication);
router.delete("/:applicationId", deleteApplication);

export default router;
