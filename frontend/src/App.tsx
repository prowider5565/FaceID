import { useState } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'

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

type AttendanceStatus = {
  status: 'Present' | 'Absent' | 'Late' | 'Day off'
  count: number
  color: string
}

type SystemMetric = {
  label: 'Cameras' | 'Employees' | 'Admins' | 'Managers'
  count: number
}

type PageKey = 'dashboard' | 'employees'

type NavItem = {
  key: PageKey
  label: string
}

const navigationItems: NavItem[] = [
  { key: 'dashboard', label: 'Overview' },
  { key: 'employees', label: 'Employees' },
]

const attendanceStatuses: AttendanceStatus[] = [
  { status: 'Present', count: 148, color: '#22c55e' },
  { status: 'Absent', count: 24, color: '#ef4444' },
  { status: 'Late', count: 13, color: '#f59e0b' },
  { status: 'Day off', count: 35, color: '#3b82f6' },
]

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
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
      isActive: false,
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
              key={item.key}
              type="button"
              className={`nav-item${activePage === item.key ? ' nav-item-active' : ''}`}
              onClick={() => setActivePage(item.key)}
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
        {activePage === 'dashboard' ? (
          <Dashboard
            employees={activeEmployees}
            metrics={systemMetrics}
            attendanceStatuses={attendanceStatuses}
          />
        ) : (
          <Employees employees={employees} />
        )}
      </main>
    </div>
  )
}

export default App
