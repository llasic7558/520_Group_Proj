export class UserCourse {
  constructor({
    user_course_id = null,
    profile_id,
    course_id,
    status = "",
    grade = ""
  }) {
    this.userCourseId = user_course_id;
    this.profileId = profile_id;
    this.courseId = course_id;
    this.status = status;
    this.grade = grade;

    this.id = this.userCourseId;
  }
}
