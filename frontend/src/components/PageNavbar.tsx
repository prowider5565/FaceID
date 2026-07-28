import { type ReactNode, useEffect, useRef } from 'react'

type DashboardNotification = {
  id: number
  payload: unknown
  receivedAt: string
  isRead: boolean
  cameraEnrollmentState?: 'pending' | 'loading' | 'done' | 'error'
}

type NotificationUser = {
  full_name: string
}

type AttendanceNotificationPayload = {
  event_type: 'Attendance'
  data: {
    user: NotificationUser | null
    attendance_date: string | null
    direction: string
  }
}

type CameraEnrollmentNotificationPayload = {
  event_type: 'CameraEnrollment'
  data: {
    ip_address: string
    device_name: string
  }
}

export type PageNavbarProps = {
  title: string
  rightActions?: ReactNode
  notifications: DashboardNotification[]
  unreadNotifications: number
  isNotificationPanelOpen: boolean
  onToggleNotifications: () => void
  onCloseNotifications?: () => void
  onRegisterCamera: (notificationId: number) => void
}

const isAttendanceNotificationPayload = (payload: unknown): payload is AttendanceNotificationPayload => {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  const data = candidate.data as Record<string, unknown> | undefined
  return (
    candidate.event_type === 'Attendance' &&
    !!data &&
    ('attendance_date' in data) &&
    ('direction' in data)
  )
}

const isCameraEnrollmentNotificationPayload = (
  payload: unknown,
): payload is CameraEnrollmentNotificationPayload => {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  const data = candidate.data as Record<string, unknown> | undefined
  return (
    candidate.event_type === 'CameraEnrollment' &&
    !!data &&
    typeof data.ip_address === 'string' &&
    typeof data.device_name === 'string'
  )
}

const formatAttendanceMessage = (payload: AttendanceNotificationPayload): string => {
  const userName = payload.data.user?.full_name ?? 'Unknown user'
  const direction = payload.data.direction
  const attendanceDate = payload.data.attendance_date
    ? new Date(payload.data.attendance_date).toLocaleString('en-US')
    : 'Unknown time'
  return `${userName} ${direction} at ${attendanceDate}.`
}

const formatCameraEnrollmentMessage = (payload: CameraEnrollmentNotificationPayload): string => {
  return `New camera detected: ${payload.data.device_name} (${payload.data.ip_address}). Confirm to register it.`
}

function PageNavbar({
  title,
  rightActions,
  notifications,
  unreadNotifications,
  isNotificationPanelOpen,
  onToggleNotifications,
  onCloseNotifications,
  onRegisterCamera,
}: PageNavbarProps) {
  const notificationsAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isNotificationPanelOpen) return

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const anchor = notificationsAnchorRef.current
      if (!anchor) return
      if (event.target instanceof Node && anchor.contains(event.target)) return
      if (onCloseNotifications) {
        onCloseNotifications()
      } else {
        onToggleNotifications()
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown)
    }
  }, [isNotificationPanelOpen, onCloseNotifications, onToggleNotifications])

  return (
    <nav className="page-navbar" aria-label="Page navigation">
      <h1 className="page-navbar-title">{title}</h1>
      <div className="page-navbar-actions">
        {rightActions}
        <button type="button" className="utility-icon-btn" aria-label="Language">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
            <path d="M3 10h14M10 3a12 12 0 0 1 0 14M10 3a12 12 0 0 0 0 14" />
          </svg>
        </button>
        <div className="notifications-anchor" ref={notificationsAnchorRef}>
          <button
            type="button"
            className="utility-icon-btn"
            aria-label="Notifications"
            onClick={onToggleNotifications}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 17a2.2 2.2 0 0 0 2-1.3H8A2.2 2.2 0 0 0 10 17Z" />
              <path d="M15 13.7H5.1c1-1 1.4-2.1 1.4-3.8V8.6a3.5 3.5 0 1 1 7 0v1.3c0 1.7.5 2.8 1.5 3.8Z" />
            </svg>
            {unreadNotifications > 0 ? <span className="notification-badge">{unreadNotifications}</span> : null}
          </button>
          {isNotificationPanelOpen ? (
            <div className="notification-panel" aria-label="Notification list">
              <p className="notification-panel-title">Notifications</p>
              {notifications.length === 0 ? (
                <p className="notification-empty">No notifications yet.</p>
              ) : (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <article key={notification.id} className="notification-item">
                      <p className="notification-time">
                        {new Date(notification.receivedAt).toLocaleTimeString('en-US')}
                      </p>
                      <p className="notification-json">
                        {isAttendanceNotificationPayload(notification.payload)
                          ? formatAttendanceMessage(notification.payload)
                          : isCameraEnrollmentNotificationPayload(notification.payload)
                            ? formatCameraEnrollmentMessage(notification.payload)
                            : 'Unsupported notification payload.'}
                      </p>
                      {isCameraEnrollmentNotificationPayload(notification.payload) ? (
                        <div className="notification-actions">
                          <button
                            type="button"
                            className="modal-btn modal-btn-submit"
                            onClick={() => onRegisterCamera(notification.id)}
                            disabled={notification.cameraEnrollmentState === 'loading'}
                          >
                            {notification.cameraEnrollmentState === 'done'
                              ? 'Registered'
                              : notification.cameraEnrollmentState === 'loading'
                                ? 'Registering...'
                                : 'Register Camera'}
                          </button>
                          {notification.cameraEnrollmentState === 'error' ? (
                            <span className="notification-action-error">Failed. Try again.</span>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <button type="button" className="utility-icon-btn" aria-label="Profile">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="7" r="2.8" />
            <path d="M4.8 16c0-2.6 2.1-4.7 4.7-4.7h1c2.6 0 4.7 2.1 4.7 4.7" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default PageNavbar
