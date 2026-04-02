import { Router } from "express";

import { searchListings } from "../controllers/search.controller.js";

const router = Router();

router.get("/listings", searchListings);

export default router;
