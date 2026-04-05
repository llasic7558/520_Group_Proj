import { Router } from "express";

import { createListing, listListings } from "../controllers/listing.controller.js";

const router = Router();

router.post("/", createListing);
router.get("/", listListings);

export default router;
