import './App.css'

type NavItem = {
  label: string
  active?: boolean
}

type StatCard = {
  label: string
  value: string
  delta: string
}

type ModuleCard = {
  title: string
  description: string
  status: string
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

const statCards: StatCard[] = [
  { label: 'Employees On-Site', value: '148', delta: '+9 vs yesterday' },
  { label: 'Late Arrivals', value: '12', delta: '-3 vs yesterday' },
  { label: 'Face Match Accuracy', value: '99.2%', delta: '+0.4% this week' },
  { label: 'Unresolved Flags', value: '4', delta: 'Needs review' },
]

const moduleCards: ModuleCard[] = [
  {
    title: 'Real-Time Verification Queue',
    description: 'Pending face verification events from active checkpoints.',
    status: 'No active queue',
  },
  {
    title: 'Attendance Exceptions',
    description: 'Late check-ins, duplicate punches, and unmatched identities.',
    status: 'Empty',
  },
  {
    title: 'Camera Fleet Status',
    description: 'Health and uptime of enrollment and gate cameras.',
    status: 'All systems stable',
  },
  {
    title: 'Payroll Sync Monitor',
    description: 'Scheduled attendance exports and reconciliation snapshots.',
    status: 'Next sync 18:30',
  },
]

function App() {
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
          <div>
            <p className="topbar-label">Attendance Management System</p>
            <h1>Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" className="secondary-btn">
              Export Snapshot
            </button>
            <button type="button" className="primary-btn">
              Register Face Profile
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="KPI summary">
          {statCards.map((card) => (
            <article key={card.label} className="stat-card">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
              <p className="stat-delta">{card.delta}</p>
            </article>
          ))}
        </section>

        <section className="modules-grid" aria-label="Attendance modules">
          {moduleCards.map((module) => (
            <article key={module.title} className="module-card">
              <div>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
              <span className="module-status">{module.status}</span>
            </article>
          ))}
        </section>

        <section className="panel-row" aria-label="Operational panels">
          <article className="panel-card">
            <div className="panel-header">
              <h3>Today Attendance Timeline</h3>
              <span>Awaiting data</span>
            </div>
            <div className="chart-placeholder" role="img" aria-label="Timeline placeholder" />
          </article>

          <article className="panel-card">
            <div className="panel-header">
              <h3>Recent Events</h3>
              <span>0 records</span>
            </div>
            <ul className="event-list">
              <li>No activity yet.</li>
              <li>Face enrollment events will appear here.</li>
              <li>Verification anomalies will be listed for review.</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
