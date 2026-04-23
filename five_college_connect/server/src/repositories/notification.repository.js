import { query } from "../config/db.js";
import { Notification } from "../models/notification.model.js";

export class NotificationRepository {
  async createNotification({ userId, type, message }, executor = { query }) {
    const result = await executor.query(
      `
        INSERT INTO notifications (user_id, type, message)
        VALUES ($1, $2, $3)
        RETURNING notification_id, user_id, type, message, is_read, created_at
      `,
      [userId, type, message]
    );

    return new Notification(result.rows[0]);
  }

  async listNotifications(filters = {}, executor = { query }) {
    const userId = filters.userId?.trim() || "";
    const unreadOnly = Boolean(filters.unreadOnly);
    const limitValue = Number(filters.limit);
    const limit = Number.isNaN(limitValue) || limitValue <= 0 ? 20 : Math.min(limitValue, 50);

    const result = await executor.query(
      `
        SELECT notification_id, user_id, type, message, is_read, created_at
        FROM notifications
        WHERE user_id = $1::uuid
          AND ($2 = FALSE OR is_read = FALSE)
        ORDER BY created_at DESC
        LIMIT $3
      `,
      [userId, unreadOnly, limit]
    );

    return result.rows.map((row) => new Notification(row));
  }

  async countUnreadByUserId(userId, executor = { query }) {
    const result = await executor.query(
      `
        SELECT COUNT(*)::int AS unread_count
        FROM notifications
        WHERE user_id = $1::uuid
          AND is_read = FALSE
      `,
      [userId]
    );

    return result.rows[0]?.unread_count ?? 0;
  }

  async markAsRead(notificationId, userId, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE notification_id = $1::uuid
          AND user_id = $2::uuid
        RETURNING notification_id, user_id, type, message, is_read, created_at
      `,
      [notificationId, userId]
    );

    return result.rows[0] ? new Notification(result.rows[0]) : null;
  }

  async markAllAsRead(userId, executor = { query }) {
    const result = await executor.query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1::uuid
          AND is_read = FALSE
      `,
      [userId]
    );

    return result.rowCount;
  }
}
