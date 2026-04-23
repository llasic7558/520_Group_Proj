import { AccountService } from "../services/account.service.js";
import { validateSignInPayload, validateSignUpPayload } from "../validators/auth.validator.js";
import { validateProfilePayload } from "../validators/profile.validator.js";

const accountService = new AccountService();

export async function signUp(req, res, next) {
  try {
    // Expected frontend payload:
    // {
    //   email,
    //   username,
    //   password,
    //   role,
    //   profile: {
    //     fullName,
    //     bio,
    //     college,
    //     major,
    //     graduationYear,
    //     skills: [{ name, category, proficiencyLevel, isOfferingHelp, isSeekingHelp }],
    //     courses: [{ courseCode, courseName, institution, status, grade }],
    //     interests,
    //     availability,
    //     lookingFor,
    //     profileImageUrl
    //     // skills and courses are modeled separately through UserSkill/UserCourse
    //   }
    // }
    const accountPayload = validateSignUpPayload(req.body);
    const profilePayload = validateProfilePayload(req.body.profile || {});

    const result = await accountService.registerAccount({
      ...accountPayload,
      profile: profilePayload
    });

    res.status(201).json({
      message: "Account created successfully",
      authToken: result.authToken,
      user: {
        id: result.user.userId,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        emailVerified: result.user.emailVerified
      },
      profile: result.profile
    });
  } catch (error) {
    next(error);
  }
}

export async function signIn(req, res, next) {
  try {
    const payload = validateSignInPayload(req.body);
    const result = await accountService.login(payload);

    res.status(200).json({
      message: "Signed in successfully",
      authToken: result.authToken,
      user: {
        id: result.user.userId,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        emailVerified: result.user.emailVerified
      },
      profile: result.profile
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const result = await accountService.verifyEmailToken(req.query.token);

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: result.user.userId,
        email: result.user.email,
        username: result.user.username,
        role: result.user.role,
        emailVerified: result.user.emailVerified
      },
      profile: result.profile
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationEmail(req, res, next) {
  try {
    await accountService.resendVerificationEmail(req.user.userId);

    res.status(200).json({
      message: "Verification email sent successfully"
    });
  } catch (error) {
    next(error);
  }
}
