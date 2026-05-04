import { useEffect, useMemo, useRef, useState } from 'react'
import { IconBell } from './opportunities/Icons.jsx'
import './NotificationBell.css'

function formatNotificationTime(value) {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Just now'
  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute))
    return `${minutes}m ago`
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours}h ago`
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function notificationTitle(notification) {
  if (notification?.type === 'new_application') return 'New application'
  if (notification?.type === 'application') return 'Application update'
  if (notification?.type === 'system') return 'System message'
  return 'Notification'
}

export default function NotificationBell({
  buttonClassName = 'fcc-icon-btn',
  initialNotifications = [],
}) {
  const rootRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )
  const visibleUnreadCount = unreadCount > 99 ? '99+' : String(unreadCount)

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleNotificationClick(notificationId) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.notificationId === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    )
  }

  function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    )
  }

  return (
    <div className="fcc-notification-bell" ref={rootRef}>
      <button
        type="button"
        className={`${buttonClassName} fcc-notification-bell__trigger`}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <IconBell />
        {unreadCount > 0 ? (
          <span className="fcc-notification-bell__badge">
            {visibleUnreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          className="fcc-notification-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="fcc-notification-panel__header">
            <div>
              <p className="fcc-notification-panel__eyebrow">Inbox</p>
              <h2 className="fcc-notification-panel__title">Notifications</h2>
            </div>
            <button
              type="button"
              className="fcc-notification-panel__mark-all"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="fcc-notification-panel__body">
            {notifications.length === 0 ? (
              <div className="fcc-notification-panel__empty">
                <span aria-hidden>✓</span>
                <p>No new notifications</p>
                <small>Application alerts will appear here soon.</small>
              </div>
            ) : (
              <ul className="fcc-notification-list">
                {notifications.map((notification) => {
                  const isUnread = !notification.isRead
                  return (
                    <li key={notification.notificationId}>
                      <button
                        type="button"
                        className={
                          isUnread
                            ? 'fcc-notification-item fcc-notification-item--unread'
                            : 'fcc-notification-item'
                        }
                        onClick={() =>
                          handleNotificationClick(notification.notificationId)
                        }
                      >
                        <span className="fcc-notification-item__dot" aria-hidden />
                        <span className="fcc-notification-item__content">
                          <span className="fcc-notification-item__topline">
                            <strong>{notificationTitle(notification)}</strong>
                            <time>{formatNotificationTime(notification.createdAt)}</time>
                          </span>
                          <span className="fcc-notification-item__message">
                            {notification.message}
                          </span>
                          <span className="fcc-notification-item__action">
                            View applications
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
