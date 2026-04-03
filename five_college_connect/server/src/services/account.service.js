import { withTransaction } from "../config/db.js";
import { CourseRepository } from "../repositories/course.repository.js";
import { ProfileRepository } from "../repositories/profile.repository.js";
import { SkillRepository } from "../repositories/skill.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserCourseRepository } from "../repositories/user-course.repository.js";
import { UserSkillRepository } from "../repositories/user-skill.repository.js";
import { AuthenticationService } from "./authentication.service.js";
import { createHttpError } from "../utils/http-error.js";

export class AccountService {
  constructor() {
    this.authenticationService = new AuthenticationService();
    this.userRepository = new UserRepository();
    this.profileRepository = new ProfileRepository();
    this.skillRepository = new SkillRepository();
    this.courseRepository = new CourseRepository();
    this.userSkillRepository = new UserSkillRepository();
    this.userCourseRepository = new UserCourseRepository();
  }

  async registerAccount({ email, username, password, role, profile }) {
    if (!this.authenticationService.isAllowedUniversityEmail(email)) {
      throw createHttpError(400, "A Five Colleges email address is required");
    }

    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw createHttpError(409, "An account with that email already exists");
    }

    const existingUserByUsername = await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw createHttpError(409, "That username is already taken");
    }

    const passwordHash = await this.authenticationService.hashPassword(password);

    const { user, fullProfile } = await withTransaction(async (client) => {
      const createdUser = await this.userRepository.createUser(
        {
          email,
          username,
          passwordHash,
          role
        },
        client
      );

      const createdProfile = await this.profileRepository.createProfile(
        {
          userId: createdUser.userId,
          ...profile
        },
        client
      );

      for (const skill of profile.skills) {
        const savedSkill = await this.skillRepository.findOrCreateSkill(
          {
            name: skill.name,
            category: skill.category
          },
          client
        );

        await this.userSkillRepository.createUserSkill(
          {
            userId: createdUser.userId,
            profileId: createdProfile.profileId,
            skillId: savedSkill.skillId,
            proficiencyLevel: skill.proficiencyLevel,
            isOfferingHelp: skill.isOfferingHelp,
            isSeekingHelp: skill.isSeekingHelp
          },
          client
        );
      }

      for (const course of profile.courses) {
        const savedCourse = await this.courseRepository.findOrCreateCourse(
          {
            courseCode: course.courseCode,
            courseName: course.courseName,
            institution: course.institution
          },
          client
        );

        await this.userCourseRepository.createUserCourse(
          {
            userId: createdUser.userId,
            profileId: createdProfile.profileId,
            courseId: savedCourse.courseId,
            status: course.status,
            grade: course.grade
          },
          client
        );
      }

      return {
        user: createdUser,
        fullProfile: await this.buildFullProfile(createdProfile, client)
      };
    });

    return {
      user,
      profile: fullProfile,
      authToken: this.authenticationService.createAuthToken({
        userId: user.userId,
        email: user.email,
        role: user.role
      })
    };
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw createHttpError(401, "Invalid email or password");
    }

    const passwordMatches = await this.authenticationService.verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw createHttpError(401, "Invalid email or password");
    }

    const profile = await this.profileRepository.findByUserId(user.userId);

    return {
      user,
      profile: await this.buildFullProfile(profile),
      authToken: this.authenticationService.createAuthToken({
        userId: user.userId,
        email: user.email,
        role: user.role
      })
    };
  }

  async buildFullProfile(profile, executor) {
    if (!profile) {
      return null;
    }

    const [skills, courses] = await Promise.all([
      this.userSkillRepository.findSkillsByProfileId(profile.profileId, executor),
      this.userCourseRepository.findCoursesByProfileId(profile.profileId, executor)
    ]);

    profile.skills = skills;
    profile.courses = courses;
    profile.coursesTaken = courses;

    return profile;
  }
}
