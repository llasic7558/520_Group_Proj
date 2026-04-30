import { Router } from "express";

import applicationRoutes from "./application.routes.js";
import authRoutes from "./auth.routes.js";
import listingRoutes from "./listing.routes.js";
import notificationRoutes from "./notification.routes.js";
import profileRoutes from "./profile.routes.js";
import searchRoutes from "./search.routes.js";
import studyGroupRoutes from "./study-group.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/listings", listingRoutes);
router.use("/applications", applicationRoutes);
router.use("/study-groups", studyGroupRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);

export default router;
