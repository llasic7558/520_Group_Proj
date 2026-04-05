import { Router } from "express";

import { signIn, signUp } from "../controllers/auth.controller.js";

const router = Router();

// Week 2 deliverable: create the user account and initial profile information.
router.post("/signup", signUp);

// Week 2 deliverable: login endpoint for testing and frontend wiring.
router.post("/signin", signIn);

export default router;
