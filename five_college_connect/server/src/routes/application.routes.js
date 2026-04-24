import { Router } from "express";

import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication
} from "../controllers/application.controller.js";
import { requireAuth, requireVerifiedEmail } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireVerifiedEmail, createApplication);
router.get("/", requireAuth, listApplications);
router.get("/:applicationId", requireAuth, getApplication);
router.put("/:applicationId", requireAuth, updateApplication);
router.delete("/:applicationId", requireAuth, deleteApplication);

export default router;
