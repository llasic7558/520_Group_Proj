import { Router } from "express";

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.patch("/read-all", requireAuth, markAllNotificationsAsRead);
router.patch("/:notificationId/read", requireAuth, markNotificationAsRead);

export default router;
