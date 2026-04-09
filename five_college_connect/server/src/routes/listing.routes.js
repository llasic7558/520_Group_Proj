import { Router } from "express";

import {
  createListing,
  deleteListing,
  getListing,
  listListings,
  updateListing
} from "../controllers/listing.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createListing);
router.get("/", listListings);
router.get("/:listingId", getListing);
router.put("/:listingId", requireAuth, updateListing);
router.delete("/:listingId", requireAuth, deleteListing);

export default router;
