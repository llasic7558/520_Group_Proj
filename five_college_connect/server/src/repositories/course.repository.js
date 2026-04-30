import { query } from "../config/db.js";
import { Course } from "../models/course.model.js";

export class CourseRepository {
  async findByCodeAndInstitution(courseCode, institution, executor = { query }) {
    const result = await executor.query(
      `
        SELECT course_id, course_code, course_name, institution
        FROM courses
        WHERE course_code = $1 AND institution = $2
      `,
      [courseCode, institution]
    );

    return result.rows[0] ? new Course(result.rows[0]) : null;
  }

  async createCourse({ courseCode, courseName, institution }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO courses (course_code, course_name, institution)
        VALUES ($1, $2, $3)
        RETURNING course_id, course_code, course_name, institution
      `,
      [courseCode, courseName, institution]
    );

    return new Course(result.rows[0]);
  }

  async findOrCreateCourse(coursePayload, executor = { query }) {
    const existingCourse = await this.findByCodeAndInstitution(
      coursePayload.courseCode,
      coursePayload.institution,
      executor
    );

    if (existingCourse) {
      return existingCourse;
    }

    return this.createCourse(coursePayload, executor);
  }
}
