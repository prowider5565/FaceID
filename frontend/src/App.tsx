import './App.css'

type NavItem = {
  label: string
  active?: boolean
}

type AttendanceStatus = {
  status: 'Present' | 'Absent' | 'Late' | 'Day off'
  count: number
  color: string
}

type Shift = 'Day' | 'Night'

type Employee = {
  id: number
  fullName: string
  phoneNumber: string
  hourlyRate: number
  position: string
  shift: Shift
  isActive: boolean
  createdAt: string
  updatedAt: string
  checkInAt: string | null
}

type SystemMetric = {
  label: 'Cameras' | 'Employees' | 'Admins' | 'Managers'
  count: number
}

const renderMetricIcon = (label: SystemMetric['label']) => {
  if (label === 'Employees') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="6.5" cy="6.2" r="2.3" />
        <circle cx="13.8" cy="7.2" r="1.9" />
        <path d="M2.8 14.8c0-2.3 1.9-4.2 4.2-4.2h0.8c2.3 0 4.2 1.9 4.2 4.2" />
        <path d="M11.3 14.8c0-1.7 1.4-3 3-3h0.6c1.7 0 3 1.3 3 3" />
      </svg>
    )
  }

  if (label === 'Cameras') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="5" width="14" height="10" rx="2" />
        <circle cx="10" cy="10" r="2.8" />
        <path d="M6.2 5 7.4 3.5h5.2L13.8 5" />
      </svg>
    )
  }

  if (label === 'Managers') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="5.6" r="2.4" />
        <path d="M5.4 14.4c0-2.5 2.1-4.6 4.6-4.6s4.6 2.1 4.6 4.6" />
        <path d="M10 2.2v2.1M7.6 3.1l1.1 1.7M12.4 3.1l-1.1 1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4.2" y="2.8" width="11.6" height="14.4" rx="2" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  )
}

const navigationItems: NavItem[] = [
  { label: 'Overview', active: true },
  { label: 'Live Capture' },
  { label: 'Employees' },
  { label: 'Attendance Logs' },
  { label: 'Shift Planner' },
  { label: 'Reports' },
  { label: 'Device Health' },
  { label: 'Access Rules' },
  { label: 'Settings' },
]

const attendanceStatuses: AttendanceStatus[] = [
  { status: 'Present', count: 148, color: '#22c55e' },
  { status: 'Absent', count: 24, color: '#ef4444' },
  { status: 'Late', count: 13, color: '#f59e0b' },
  { status: 'Day off', count: 35, color: '#3b82f6' },
]

function App() {
  const now = new Date()
  const todayDate = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`

  const employees: Employee[] = [
    {
      id: 100001,
      fullName: 'Maria Lopez',
      phoneNumber: '+1-555-0101',
      hourlyRate: 22.5,
      position: 'Receptionist',
      shift: 'Day',
      isActive: true,
      createdAt: '2025-07-12T10:00:00',
      updatedAt: '2026-02-24T08:00:00',
      checkInAt: `${todayDate}T08:43:00`,
    },
    {
      id: 100002,
      fullName: 'James Carter',
      phoneNumber: '+1-555-0102',
      hourlyRate: 28,
      position: 'Security Officer',
      shift: 'Day',
      isActive: true,
      createdAt: '2025-08-01T09:30:00',
      updatedAt: '2026-02-24T08:10:00',
      checkInAt: `${todayDate}T09:18:00`,
    },
    {
      id: 100003,
      fullName: 'Olivia Nguyen',
      phoneNumber: '+1-555-0103',
      hourlyRate: 24,
      position: 'HR Specialist',
      shift: 'Day',
      isActive: true,
      createdAt: '2025-05-09T11:20:00',
      updatedAt: '2026-02-24T08:12:00',
      checkInAt: `${todayDate}T08:55:00`,
    },
    {
      id: 100004,
      fullName: 'Noah Patel',
      phoneNumber: '+1-555-0104',
      hourlyRate: 26,
      position: 'Warehouse Clerk',
      shift: 'Night',
      isActive: true,
      createdAt: '2025-10-02T13:10:00',
      updatedAt: '2026-02-24T07:50:00',
      checkInAt: null,
    },
    {
      id: 100005,
      fullName: 'Ava Johnson',
      phoneNumber: '+1-555-0105',
      hourlyRate: 31.5,
      position: 'Floor Supervisor',
      shift: 'Day',
      isActive: true,
      createdAt: '2025-04-18T12:00:00',
      updatedAt: '2026-02-24T08:01:00',
      checkInAt: `${todayDate}T09:07:00`,
    },
    {
      id: 100006,
      fullName: 'Ethan Wright',
      phoneNumber: '+1-555-0106',
      hourlyRate: 27,
      position: 'Maintenance Tech',
      shift: 'Night',
      isActive: true,
      createdAt: '2025-11-11T09:40:00',
      updatedAt: '2026-02-24T08:08:00',
      checkInAt: `${todayDate}T20:52:00`,
    },
  ]

  const activeEmployees = employees.filter((employee) => employee.isActive)
  const systemMetrics: SystemMetric[] = [
    { label: 'Cameras', count: 14 },
    { label: 'Employees', count: activeEmployees.length },
    { label: 'Admins', count: 2 },
    { label: 'Managers', count: 1 },
  ]

  const totalEmployees = attendanceStatuses.reduce((sum, item) => sum + item.count, 0)
  let cumulative = 0

  const pieGradient = attendanceStatuses
    .map((item) => {
      const start = (cumulative / totalEmployees) * 100
      cumulative += item.count
      const end = (cumulative / totalEmployees) * 100
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            FI
          </span>
          <div>
            <p className="brand-name">FaceID Attendance</p>
            <p className="brand-subtitle">Operations Console</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item${item.active ? ' nav-item-active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="compliance-box">
          <p className="compliance-title">Privacy Compliance</p>
          <p className="compliance-copy">
            Biometric templates encrypted at rest. Access audit is enabled.
          </p>
        </div>
      </aside>

      <main className="content">
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
          <article className="checkin-summary">
            <h2>Today&apos;s Check-in Status (real-time)</h2>

            <div className="employee-checkin-cards">
              {activeEmployees.map((employee) => (
                <article key={employee.id} className="employee-checkin-card">
                  <div>
                    <p className="employee-name">{employee.fullName}</p>
                    <p className="employee-meta">
                      {employee.position} • {employee.shift} Shift
                    </p>
                  </div>
                  <p className="employee-checkin-time">
                    {employee.checkInAt
                      ? new Date(employee.checkInAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Not checked in yet'}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <div className="insights-side">
            <article className="metric-summary" aria-label="System counts">
              <ul className="metric-grid">
                {systemMetrics.map((item) => (
                  <li key={item.label}>
                    <span className="metric-label">
                      <span className="metric-icon">{renderMetricIcon(item.label)}</span>
                      {item.label}
                    </span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="attendance-summary" aria-label="Attendance status chart">
              <h2>Employees Attendance</h2>
              <div className="attendance-chart-row">
                <div
                  className="attendance-pie"
                  style={{ background: `conic-gradient(${pieGradient})` }}
                  role="img"
                  aria-label="Employees attendance status distribution pie chart"
                />
                <ul className="attendance-legend">
                  {attendanceStatuses.map((item) => {
                    const percentage = ((item.count / totalEmployees) * 100).toFixed(1)

                    return (
                      <li key={item.status}>
                        <span className="legend-label">
                          <span className="legend-dot" style={{ backgroundColor: item.color }} />
                          {item.status}
                        </span>
                        <span className="legend-value">
                          {item.count} ({percentage}%)
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
