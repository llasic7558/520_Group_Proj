import { Router } from "express";

import {
  createListing,
  deleteListing,
  getListing,
  listListings,
  updateListing
} from "../controllers/listing.controller.js";

const router = Router();

router.post("/", createListing);
router.get("/", listListings);
router.get("/:listingId", getListing);
router.put("/:listingId", updateListing);
router.delete("/:listingId", deleteListing);

export default router;
