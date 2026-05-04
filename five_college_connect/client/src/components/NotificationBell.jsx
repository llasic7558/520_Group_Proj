import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconBell } from './opportunities/Icons.jsx'
import { useAuth } from '../context/AuthContext.js'
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/api.js'
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
  const { user } = useAuth()
  const rootRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(
    () => initialNotifications.filter((notification) => !notification.isRead).length,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingNotificationId, setUpdatingNotificationId] = useState('')
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  const visibleUnreadCount = useMemo(
    () => (unreadCount > 99 ? '99+' : String(unreadCount)),
    [unreadCount],
  )

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const payload = await fetchNotifications({ limit: 20 })
      setNotifications(payload.items)
      setUnreadCount(payload.unreadCount)
    } catch (err) {
      setErrorMessage(err?.message || 'Could not load notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    loadNotifications()
  }, [loadNotifications, user?.id])

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

  async function handleToggle() {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)

    if (nextOpen && user?.id && notifications.length === 0) {
      await loadNotifications()
    }
  }

  async function handleNotificationClick(notification) {
    if (notification.isRead) return

    setUpdatingNotificationId(notification.notificationId)
    setErrorMessage('')

    try {
      const updatedNotification = await markNotificationAsRead(
        notification.notificationId,
      )
      setNotifications((current) =>
        current.map((item) =>
          item.notificationId === notification.notificationId
            ? { ...item, ...updatedNotification, isRead: true }
            : item,
        ),
      )
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (err) {
      setErrorMessage(err?.message || 'Could not mark notification as read.')
    } finally {
      setUpdatingNotificationId('')
    }
  }

  async function handleMarkAllRead() {
    setIsMarkingAllRead(true)
    setErrorMessage('')

    try {
      await markAllNotificationsAsRead()
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      )
      setUnreadCount(0)
    } catch (err) {
      setErrorMessage(err?.message || 'Could not mark notifications as read.')
    } finally {
      setIsMarkingAllRead(false)
    }
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
        onClick={handleToggle}
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
              disabled={unreadCount === 0 || isMarkingAllRead}
            >
              {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
            </button>
          </div>

          <div className="fcc-notification-panel__body">
            {isLoading ? (
              <p className="fcc-notification-panel__state">
                Loading notifications...
              </p>
            ) : errorMessage ? (
              <div className="fcc-notification-panel__state" role="alert">
                <p>{errorMessage}</p>
                <button type="button" onClick={loadNotifications}>
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="fcc-notification-panel__empty">
                <span aria-hidden>✓</span>
                <p>No new notifications</p>
                <small>You are all caught up.</small>
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
                        onClick={() => handleNotificationClick(notification)}
                        disabled={
                          updatingNotificationId === notification.notificationId
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
                            {isUnread ? 'Mark as read' : 'Read'}
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
