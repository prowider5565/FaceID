import AttendancePieCard from '../components/AttendancePieCard'
import Button from '../components/Button'
import CheckinTodayCard from '../components/CheckinTodayCard'
import CountCards from '../components/CountCards'
import PageNavbar from '../components/PageNavbar'
import ShiftIndicatorCard from '../components/ShiftIndicatorCard'

type Shift = 'Day' | 'Night'

type CheckinEvent = {
  eventId: number
  userId: number
  fullName: string
  position: string
  shift: Shift
  checkInAt: string | null
  direction: string | null
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
  cameraEnrollmentState?: 'pending' | 'loading' | 'done' | 'error'
}

type DashboardProps = {
  events: CheckinEvent[]
  metrics: SystemMetric[]
  attendanceStatuses: AttendanceStatus[]
  dayShift?: { start_time: string; end_time: string } | null
  nightShift?: { start_time: string; end_time: string } | null
  notifications: DashboardNotification[]
  unreadNotifications: number
  isNotificationPanelOpen: boolean
  onToggleNotifications: () => void
  onRegisterCamera: (notificationId: number) => void
  onCloseNotifications?: () => void
}

function Dashboard({
  events,
  metrics,
  attendanceStatuses,
  dayShift,
  nightShift,
  notifications,
  unreadNotifications,
  isNotificationPanelOpen,
  onToggleNotifications,
  onCloseNotifications,
  onRegisterCamera,
}: DashboardProps) {
  return (
    <>
      <PageNavbar
        title="Dashboard"
        rightActions={
          <Button type="button" variant="secondary" size="sm" className="page-navbar-action-btn">
            Export Snapshot
          </Button>
        }
        notifications={notifications}
        unreadNotifications={unreadNotifications}
        isNotificationPanelOpen={isNotificationPanelOpen}
        onToggleNotifications={onToggleNotifications}
        onCloseNotifications={onCloseNotifications}
        onRegisterCamera={onRegisterCamera}
      />

      <section className="insights-row" aria-label="Today attendance insights">
        <CheckinTodayCard events={events} />

        <div className="insights-side">
          <div className="shift-indicator-container" aria-label="Configured shift times">
            <ShiftIndicatorCard shift="Day" startTime={dayShift?.start_time ?? null} endTime={dayShift?.end_time ?? null} />
            <ShiftIndicatorCard shift="Night" startTime={nightShift?.start_time ?? null} endTime={nightShift?.end_time ?? null} />
          </div>
          <CountCards metrics={metrics} />
          <AttendancePieCard statuses={attendanceStatuses} valueMode="percentage" />
        </div>
      </section>
    </>
  )
}

export default Dashboard
