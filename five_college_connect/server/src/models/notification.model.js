export class Notification {
  constructor({
    notification_id = null,
    user_id,
    type = "",
    message = "",
    is_read = false,
    created_at = null
  }) {
    this.notificationId = notification_id;
    this.userId = user_id;
    this.type = type;
    this.message = message;
    this.isRead = is_read;
    this.createdAt = created_at;

    this.id = this.notificationId;
  }
}
