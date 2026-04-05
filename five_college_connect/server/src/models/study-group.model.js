export class StudyGroup {
  constructor({
    group_id = null,
    created_by_user_id,
    course_id = null,
    group_name,
    description = "",
    category = "",
    status = "active",
    created_at = null
  }) {
    this.groupId = group_id;
    this.createdByUserId = created_by_user_id;
    this.courseId = course_id;
    this.groupName = group_name;
    this.description = description;
    this.category = category;
    this.status = status;
    this.createdAt = created_at;

    // Backward-compatible aliases for older week 2 code.
    this.id = this.groupId;
    this.ownerId = this.createdByUserId;
    this.title = this.groupName;
    this.courseCode = this.courseId;
  }
}
