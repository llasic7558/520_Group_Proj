import { Router } from "express";

import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:userId", getProfile);
router.put("/:userId", requireAuth, updateProfile);

export default router;
