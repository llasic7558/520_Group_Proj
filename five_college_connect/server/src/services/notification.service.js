import { NotificationRepository } from "../repositories/notification.repository.js";
import { createHttpError } from "../utils/http-error.js";

function parseUnreadOnly(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return value.trim().toLowerCase() === "true";
}

export class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async listNotifications(filters = {}) {
    const userId = filters.userId?.trim() || "";
    const unreadOnly = parseUnreadOnly(filters.unreadOnly);
    const items = await this.notificationRepository.listNotifications({
      userId,
      unreadOnly,
      limit: filters.limit
    });
    const unreadCount = await this.notificationRepository.countUnreadByUserId(userId);

    return {
      items,
      unreadCount
    };
  }

  async markNotificationAsRead(notificationId, userId) {
    const notification = await this.notificationRepository.markAsRead(notificationId, userId);

    if (!notification) {
      throw createHttpError(404, "Notification not found");
    }

    return notification;
  }

  async markAllNotificationsAsRead(userId) {
    const updatedCount = await this.notificationRepository.markAllAsRead(userId);

    return {
      updatedCount
    };
  }
}
