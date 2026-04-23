import { NotificationService } from "../services/notification.service.js";

const notificationService = new NotificationService();

export async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationService.listNotifications({
      userId: req.user.userId,
      unreadOnly: req.query.unreadOnly,
      limit: req.query.limit
    });

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationAsRead(
      req.params.notificationId,
      req.user.userId
    );

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.userId);

    res.status(200).json({
      message: "Notifications marked as read",
      ...result
    });
  } catch (error) {
    next(error);
  }
}
