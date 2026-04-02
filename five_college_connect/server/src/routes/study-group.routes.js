import { Router } from "express";

import { createStudyGroup } from "../controllers/study-group.controller.js";

const router = Router();

router.post("/", createStudyGroup);

export default router;
