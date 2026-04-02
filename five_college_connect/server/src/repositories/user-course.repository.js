import { query } from "../config/db.js";

export class UserCourseRepository {
  async createUserCourse({ profileId, courseId, status, grade }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO user_courses (profile_id, course_id, status, grade)
        VALUES ($1, $2, $3, $4)
        RETURNING user_course_id, profile_id, course_id, status, grade
      `,
      [profileId, courseId, status, grade]
    );

    return result.rows[0];
  }

  async findCoursesByProfileId(profileId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT
          uc.user_course_id,
          uc.profile_id,
          uc.course_id,
          uc.status,
          uc.grade,
          c.course_code,
          c.course_name,
          c.institution
        FROM user_courses uc
        JOIN courses c ON c.course_id = uc.course_id
        WHERE uc.profile_id = $1
        ORDER BY c.course_code ASC
      `,
      [profileId]
    );

    return result.rows.map((row) => ({
      userCourseId: row.user_course_id,
      profileId: row.profile_id,
      courseId: row.course_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      institution: row.institution,
      status: row.status,
      grade: row.grade
    }));
  }
}
