import { Router } from "express";

import { resendVerificationEmail, signIn, signUp, verifyEmail } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// create the user account and initial profile information.
router.post("/signup", signUp);

// login endpoint for testing and frontend wiring.
router.post("/signin", signIn);

// email verification endpoints
router.get("/verify-email", verifyEmail);
router.post("/verify-email/resend", requireAuth, resendVerificationEmail);

export default router;
