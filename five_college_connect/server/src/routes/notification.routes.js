import { Router } from "express";

import { listNotifications } from "../controllers/notification.controller.js";

const router = Router();

router.get("/", listNotifications);

export default router;
