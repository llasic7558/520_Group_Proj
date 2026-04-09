import { ProfileService } from "../services/profile.service.js";
import { validateProfilePayload } from "../validators/profile.validator.js";

const profileService = new ProfileService();

export async function createProfile(_req, res) {
  // profile data is created during sign-up so the frontend only needs
  // one request to create the account and initial profile information.
  res.status(405).json({
    message: "Use POST /api/auth/signup to create the user and initial profile together"
  });
}

export async function updateProfile(req, res, next) {
  try {
    const payload = validateProfilePayload(req.body || {});
    const profile = await profileService.updateProfile(req.params.userId, payload);

    res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfileByUserId(req.params.userId);

    res.status(200).json({
      profile
    });
  } catch (error) {
    next(error);
  }
}
