import { Router } from "express";

import {
  createListing,
  deleteListing,
  getListing,
  listListings,
  permanentlyDeleteListing,
  reopenListing,
  updateListing
} from "../controllers/listing.controller.js";
import { requireAuth, requireVerifiedEmail } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireVerifiedEmail, createListing);
router.get("/", listListings);
router.delete("/:listingId/permanent", requireAuth, permanentlyDeleteListing);
router.post("/:listingId/reopen", requireAuth, reopenListing);
router.get("/:listingId", getListing);
router.put("/:listingId", requireAuth, updateListing);
router.delete("/:listingId", requireAuth, deleteListing);

export default router;
