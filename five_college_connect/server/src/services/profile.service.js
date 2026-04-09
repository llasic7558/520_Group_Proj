import { withTransaction } from "../config/db.js";
import { CourseRepository } from "../repositories/course.repository.js";
import { ProfileRepository } from "../repositories/profile.repository.js";
import { SkillRepository } from "../repositories/skill.repository.js";
import { UserCourseRepository } from "../repositories/user-course.repository.js";
import { UserSkillRepository } from "../repositories/user-skill.repository.js";
import { createHttpError } from "../utils/http-error.js";

export class ProfileService {
  constructor() {
    this.profileRepository = new ProfileRepository();
    this.skillRepository = new SkillRepository();
    this.courseRepository = new CourseRepository();
    this.userSkillRepository = new UserSkillRepository();
    this.userCourseRepository = new UserCourseRepository();
  }

  async getProfileByUserId(userId, executor) {
    const profile = await this.profileRepository.findByUserId(userId, executor);

    if (!profile) {
      throw createHttpError(404, "Profile not found");
    }

    return this.buildFullProfile(profile, executor);
  }

  async updateProfile(userId, payload) {
    return withTransaction(async (client) => {
      const existingProfile = await this.profileRepository.findByUserId(userId, client);

      if (!existingProfile) {
        throw createHttpError(404, "Profile not found");
      }

      const updatedProfile = await this.profileRepository.updateByUserId(userId, payload, client);

      await this.userSkillRepository.deleteByProfileId(existingProfile.profileId, client);
      await this.userCourseRepository.deleteByProfileId(existingProfile.profileId, client);

      for (const skill of payload.skills) {
        const savedSkill = await this.skillRepository.findOrCreateSkill(
          {
            name: skill.name,
            category: skill.category
          },
          client
        );

        await this.userSkillRepository.createUserSkill(
          {
            userId,
            profileId: existingProfile.profileId,
            skillId: savedSkill.skillId,
            proficiencyLevel: skill.proficiencyLevel,
            isOfferingHelp: skill.isOfferingHelp,
            isSeekingHelp: skill.isSeekingHelp
          },
          client
        );
      }

      for (const course of payload.courses) {
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
            userId,
            profileId: existingProfile.profileId,
            courseId: savedCourse.courseId,
            status: course.status,
            grade: course.grade
          },
          client
        );
      }

      return this.getProfileByUserId(userId, client);
    });
  }

  async buildFullProfile(profile, executor) {
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
