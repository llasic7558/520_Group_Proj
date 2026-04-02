export class Course {
  constructor({
    course_id = null,
    course_code = "",
    course_name = "",
    institution = ""
  }) {
    this.courseId = course_id;
    this.courseCode = course_code;
    this.courseName = course_name;
    this.institution = institution;

    this.id = this.courseId;
  }
}
