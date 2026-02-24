import AttendancePieCard from '../components/AttendancePieCard'
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

type DashboardProps = {
  employees: Employee[]
  metrics: SystemMetric[]
  attendanceStatuses: AttendanceStatus[]
}

function Dashboard({ employees, metrics, attendanceStatuses }: DashboardProps) {
  return (
    <>
      <header className="topbar">
        <h1>Dashboard</h1>
        <div className="topbar-actions">
          <button type="button" className="secondary-btn">
            Export Snapshot
          </button>
          <button type="button" className="primary-btn">
            Register Face Profile
          </button>
        </div>
      </header>

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
