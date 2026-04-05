export class User {
  constructor({
    user_id = null,
    email,
    username,
    password_hash = null,
    role = "student",
    email_verified = false,
    teacher_badge = false,
    created_at = null,
    status = "active"
  }) {
    this.userId = user_id;
    this.email = email;
    this.username = username;
    this.passwordHash = password_hash;
    this.role = role;
    this.emailVerified = email_verified;
    this.teacherBadge = teacher_badge;
    this.createdAt = created_at;
    this.status = status;

    // Backward-compatible aliases for older week 2 code.
    this.id = this.userId;
  }
}
