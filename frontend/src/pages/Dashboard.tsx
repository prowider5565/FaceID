import AttendancePieCard from '../components/AttendancePieCard'
import Button from '../components/Button'
import CheckinTodayCard from '../components/CheckinTodayCard'
import CountCards from '../components/CountCards'

type Shift = 'Day' | 'Night'

type Employee = {
  id: number
  fullName: string
  position: string
  shift: Shift
  checkInAt: string | null
}

type AttendanceStatus = {
  status: 'Present' | 'Absent' | 'Late' | 'Day off'
  count: number
  color: string
}

type SystemMetric = {
  label: 'Cameras' | 'Employees' | 'Admins' | 'Managers'
  count: number
}

type DashboardNotification = {
  id: number
  payload: unknown
  receivedAt: string
  isRead: boolean
}

type DashboardProps = {
  employees: Employee[]
  metrics: SystemMetric[]
  attendanceStatuses: AttendanceStatus[]
  notifications: DashboardNotification[]
  unreadNotifications: number
  isNotificationPanelOpen: boolean
  onToggleNotifications: () => void
}

function Dashboard({
  employees,
  metrics,
  attendanceStatuses,
  notifications,
  unreadNotifications,
  isNotificationPanelOpen,
  onToggleNotifications,
}: DashboardProps) {
  return (
    <>
      <div className="dashboard-top">
        <nav className="dashboard-utility-nav" aria-label="Dashboard utilities">
          <h1>Dashboard</h1>
          <div className="dashboard-utility-actions">
            <button type="button" className="utility-icon-btn" aria-label="Language">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="7" />
                <path d="M3 10h14M10 3a12 12 0 0 1 0 14M10 3a12 12 0 0 0 0 14" />
              </svg>
            </button>
            <div className="notifications-anchor">
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
                {unreadNotifications > 0 ? (
                  <span className="notification-badge">{unreadNotifications}</span>
                ) : null}
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
                          <pre className="notification-json">
                            {JSON.stringify(notification.payload, null, 2)}
                          </pre>
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

        <header className="topbar">
          <div className="topbar-actions">
            <Button type="button" variant="secondary">
              Export Snapshot
            </Button>
            <Button type="button" variant="primary">
              Register Face Profile
            </Button>
          </div>
        </header>
      </div>

      <section className="insights-row" aria-label="Today attendance insights">
        <CheckinTodayCard employees={employees} />

        <div className="insights-side">
          <CountCards metrics={metrics} />
          <AttendancePieCard statuses={attendanceStatuses} />
        </div>
      </section>
    </>
  )
}

export default Dashboard
