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

        <section className="attendance-summary" aria-label="Attendance status chart">
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
        </section>
      </main>
    </div>
  )
}

export default App
